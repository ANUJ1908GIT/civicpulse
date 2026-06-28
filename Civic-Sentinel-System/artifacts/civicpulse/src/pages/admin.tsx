// src/pages/admin.tsx — Enterprise AI Insights
import {
  useGetDashboardStats, useGetCivicHealthScore, useGetHotspots,
  useGetTrends, useGetAuthorityPerformance, useGetWeeklyReport
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, Minus, MapPin, AlertTriangle,
  Building2, Activity, FileText, Loader2, RefreshCw, Shield,
  Brain, Sparkles, CheckCircle2, Clock
} from "lucide-react";
import { useState } from "react";

const RISK_BADGE: Record<string, string> = {
  critical: "badge-critical",
  high:     "badge-high",
  moderate: "badge-medium",
  low:      "badge-low",
};
const TREND_ICON: Record<string, React.ElementType> = {
  improving: TrendingUp, stable: Minus, declining: TrendingDown,
};
const TREND_CLS: Record<string, string> = {
  improving: "text-emerald-600", stable: "text-amber-500", declining: "text-red-500",
};
const CHART_COLORS = ["#2563EB","#16A34A","#F59E0B","#DC2626","#7C3AED","#0891B2"];

function SectionHeader({ title, subtitle, icon: Icon }: { title: string; subtitle?: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
        <Icon className="w-4.5 h-4.5 text-primary" />
      </div>
      <div>
        <h2 className="font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function Admin() {
  const { data: stats,       isLoading: statsLoading }   = useGetDashboardStats();
  const { data: healthScores,isLoading: healthLoading }  = useGetCivicHealthScore();
  const { data: hotspots,    isLoading: hotspotsLoading }= useGetHotspots();
  const { data: trends,      isLoading: trendsLoading }  = useGetTrends();
  const { data: authPerf,    isLoading: authLoading }    = useGetAuthorityPerformance();
  const { data: weeklyReport,isLoading: reportLoading, refetch } = useGetWeeklyReport();

  const healthList = Array.isArray(healthScores) ? healthScores : [];
  const hotspotList= Array.isArray(hotspots)     ? hotspots     : [];
  const authList   = Array.isArray(authPerf)     ? authPerf     : [];
  const [expanded, setExpanded] = useState(false);

  const healthScore = stats?.civicHealthScore ?? 0;
  const healthColor = healthScore > 70 ? "#16A34A" : healthScore > 50 ? "#F59E0B" : "#DC2626";

  return (
    <div className="max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Insights</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Predictive intelligence and civic performance analytics</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 self-start sm:self-auto">
          <Brain className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-primary">AI Engine Active</span>
        </div>
      </div>

      {/* Top: Health score + Weekly trend */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Civic health score */}
        <div className="card-base card-shadow bg-white dark:bg-card p-6 flex flex-col items-center justify-center">
          <div className="relative w-36 h-24 mb-4">
            <svg viewBox="0 0 120 70" className="w-full">
              <path d="M12,58 A48,48 0 1,1 108,58" fill="none" stroke="hsl(var(--border))" strokeWidth="8" strokeLinecap="round" />
              <path
                d="M12,58 A48,48 0 1,1 108,58"
                fill="none" stroke={healthColor} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${(healthScore / 100) * 150.8} 150.8`}
                style={{ transition: "stroke-dasharray 1.2s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
              <span className="text-3xl font-bold" style={{ color: healthColor }}>{healthScore}</span>
            </div>
          </div>
          <p className="text-sm font-semibold text-foreground">Civic Health Score</p>
          <p className="text-xs text-muted-foreground mt-1">
            {healthScore > 70 ? "City is performing well" : healthScore > 50 ? "Moderate issues detected" : "Immediate attention needed"}
          </p>
        </div>

        {/* Weekly trend chart */}
        <div className="card-base card-shadow bg-white dark:bg-card p-5 md:col-span-2">
          <SectionHeader title="Weekly Trend" subtitle="Reports vs resolved over time" icon={TrendingUp} />
          {trendsLoading ? (
            <div className="h-40 skeleton rounded-xl" />
          ) : trends?.weekly ? (
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={trends.weekly}>
                <defs>
                  <linearGradient id="g-reported" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g-resolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#16A34A" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, fontSize: 12 }} />
                <Area type="monotone" dataKey="reported" stroke="#2563EB" fill="url(#g-reported)" strokeWidth={2} name="Reported" />
                <Area type="monotone" dataKey="resolved" stroke="#16A34A" fill="url(#g-resolved)" strokeWidth={2} name="Resolved" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">No trend data yet</div>
          )}
        </div>
      </div>

      {/* Neighborhood ranking + Category breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Neighborhood health */}
        <div className="card-base card-shadow bg-white dark:bg-card p-5">
          <SectionHeader title="Neighborhood Ranking" subtitle="Civic health score by area" icon={MapPin} />
          {healthLoading ? (
            <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-12 skeleton rounded-lg" />)}</div>
          ) : healthList.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No neighborhood data</div>
          ) : (
            <div className="space-y-4">
              {healthList.map((n, i) => {
                const TrendIcon = TREND_ICON[n.trend] ?? Minus;
                const color = n.score > 70 ? "#16A34A" : n.score > 50 ? "#F59E0B" : "#DC2626";
                return (
                  <motion.div key={n.neighborhood} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-muted-foreground w-5">#{i+1}</span>
                        <span className="text-sm font-medium text-foreground">{n.neighborhood}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendIcon className={`w-3.5 h-3.5 ${TREND_CLS[n.trend] ?? ""}`} />
                        <span className="text-sm font-bold" style={{ color }}>{n.score}</span>
                      </div>
                    </div>
                    <Progress value={n.score} className="h-1.5" />
                    <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                      <span>{n.issueCount} issues</span>
                      <span className="text-emerald-600">{n.resolvedCount} resolved</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Category bar chart */}
        <div className="card-base card-shadow bg-white dark:bg-card p-5">
          <SectionHeader title="Issues by Category" subtitle="Distribution across departments" icon={Activity} />
          {statsLoading ? (
            <div className="h-52 skeleton rounded-xl" />
          ) : stats?.reportsByCategory ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.reportsByCategory} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="category" type="category" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={80} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} name="Count">
                  {stats.reportsByCategory.map((_: any, i: number) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-sm text-muted-foreground">No data yet</div>
          )}
        </div>
      </div>

      {/* Predictive hotspots */}
      <div className="card-base card-shadow bg-white dark:bg-card p-5">
        <SectionHeader title="Predictive Hotspots" subtitle="AI-detected risk zones requiring attention" icon={AlertTriangle} />
        {hotspotsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-28 skeleton rounded-xl" />)}
          </div>
        ) : hotspotList.length === 0 ? (
          <div className="py-12 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No hotspots detected — city is stable</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hotspotList.map((h, i) => (
              <motion.div
                key={h.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="border border-border rounded-xl p-4 space-y-2.5 hover:border-primary/30 hover:shadow-sm transition-all bg-slate-50/50 dark:bg-slate-900/20"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-foreground">{h.neighborhood}</span>
                  <Badge className={`text-[10px] font-semibold border ${RISK_BADGE[h.riskLevel] ?? "badge-medium"}`}>
                    {h.riskLevel.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={h.confidence * 100} className="h-1.5 flex-1" />
                  <span className="text-[11px] font-semibold text-muted-foreground">{Math.round(h.confidence * 100)}%</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {h.predictedIssues.slice(0, 2).map((issue: string) => (
                    <span key={issue} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-muted-foreground px-2 py-0.5 rounded-full">{issue}</span>
                  ))}
                </div>
                {h.aiReasoning && (
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{h.aiReasoning}</p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Department performance */}
      <div className="card-base card-shadow bg-white dark:bg-card p-5">
        <SectionHeader title="Department Performance" subtitle="Resolution rates and response metrics" icon={Building2} />
        {authLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 skeleton rounded-xl" />)}</div>
        ) : (
          <div className="space-y-3">
            {authList.map((dept, i) => {
              const TrendIcon = TREND_ICON[dept.trend ?? "stable"] ?? Minus;
              const score = dept.performanceScore ?? 0;
              const scoreColor = score > 70 ? "#16A34A" : score > 50 ? "#F59E0B" : "#DC2626";
              return (
                <motion.div
                  key={dept.department}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center gap-4 p-3 rounded-xl border border-border bg-slate-50/50 dark:bg-slate-900/20 hover:border-primary/20 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl border border-border bg-white dark:bg-card flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-foreground truncate">{dept.department}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <TrendIcon className={`w-3.5 h-3.5 ${TREND_CLS[dept.trend ?? "stable"] ?? ""}`} />
                        <span className="text-sm font-bold" style={{ color: scoreColor }}>{score}</span>
                      </div>
                    </div>
                    <Progress value={score} className="h-1.5" />
                    <div className="flex gap-4 mt-1.5 text-[11px] text-muted-foreground">
                      <span>{dept.assignedCount} assigned</span>
                      <span className="text-emerald-600">{dept.resolvedCount} resolved</span>
                      <span>{dept.avgResolutionDays}d avg</span>
                      {(dept.pendingCritical ?? 0) > 0 && (
                        <span className="text-red-500 font-medium">{dept.pendingCritical} critical</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Weekly Report */}
      <div className="card-base card-shadow bg-white dark:bg-card p-5 border-l-4 border-l-primary">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">AI Weekly Municipal Report</h2>
              <p className="text-xs text-muted-foreground">Generated by Gemini AI</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={reportLoading} className="h-8 text-xs">
            {reportLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
            Regenerate
          </Button>
        </div>

        {reportLoading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-4 skeleton" />)}</div>
        ) : weeklyReport ? (
          <div className="space-y-4">
            <div className="text-[11px] text-muted-foreground">
              Generated: {new Date(weeklyReport.generatedAt).toLocaleString()}
            </div>
            <p className="text-sm text-foreground leading-relaxed">{weeklyReport.summary}</p>

            {weeklyReport.highlights.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Key Highlights</p>
                <div className="space-y-1.5">
                  {weeklyReport.highlights.map((h: string, i: number) => (
                    <div key={i} className="flex gap-2.5 text-sm text-foreground">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      {h}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!expanded && weeklyReport.recommendations.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => setExpanded(true)} className="text-xs h-8">
                Show {weeklyReport.recommendations.length} recommendations
              </Button>
            )}
            {expanded && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recommendations</p>
                {weeklyReport.recommendations.map((r: string, i: number) => (
                  <div key={i} className="flex gap-2.5 text-sm text-foreground">
                    <span className="text-primary font-bold mt-0.5">→</span>
                    {r}
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 pt-2 border-t border-border text-xs">
              <span className="text-muted-foreground">Overall trend:</span>
              <span className={weeklyReport.civicHealthTrend?.toLowerCase().includes("improv") ? "text-emerald-600 font-semibold" : weeklyReport.civicHealthTrend?.toLowerCase().includes("declin") ? "text-red-500 font-semibold" : "text-amber-500 font-semibold"}>
                {weeklyReport.civicHealthTrend}
              </span>
            </div>
          </div>
        ) : (
          <Button onClick={() => refetch()} className="text-xs h-9">Generate Report</Button>
        )}
      </div>
    </div>
  );
}
