// src/pages/analytics.tsx — Analytics & Trends Dashboard
import { useGetTrends, useGetCivicHealthScore, useGetAuthorityPerformance, useGetDashboardStats } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import {
  BarChart3, TrendingUp, TrendingDown, Minus, Activity,
  Building2, MapPin, CheckCircle2, AlertCircle, ArrowUpRight
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from "recharts";

const CHART_COLORS = ["#2563EB", "#16A34A", "#F59E0B", "#DC2626", "#7C3AED", "#0891B2"];

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <div className="w-1.5 h-5 rounded-full bg-primary shrink-0" />
      <div>
        <h2 className="text-lg font-bold text-foreground leading-tight">{title}</h2>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, bg, trend }: {
  label: string; value: string | number; icon: React.ElementType;
  color: string; bg: string; trend?: "up" | "down" | "flat";
}) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-500" : "text-muted-foreground";
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-base bg-white dark:bg-card p-5 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: bg }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-3xl font-bold text-foreground tracking-tight">{value}</span>
        {trend && <TrendIcon className={`w-4 h-4 ${trendColor}`} />}
      </div>
    </motion.div>
  );
}

export default function Analytics() {
  const { data: trends, isLoading: trendsLoading } = useGetTrends();
  const { data: civicHealth, isLoading: healthLoading } = useGetCivicHealthScore();
  const { data: authorityPerf, isLoading: authorityLoading } = useGetAuthorityPerformance();
  const { data: stats } = useGetDashboardStats();

  const resolutionRate = trends?.resolutionRate ?? 0;
  const weeklyData = trends?.weekly ?? [];
  const categoryTrends = trends?.categoryTrends ?? [];

  return (
    <div className="max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 space-y-6 sm:space-y-8">

      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-6 rounded-full bg-primary" />
          <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-foreground">ANALYTICS</h1>
        </div>
        <p className="text-xs text-muted-foreground font-mono ml-3.5">
          Trends, performance metrics & civic health scores
        </p>
      </motion.div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Reports"       value={stats?.totalReports ?? 0}    icon={BarChart3}    color="#2563EB" bg="#EFF6FF" trend="up" />
        <StatCard label="Resolved"            value={stats?.resolvedReports ?? 0}  icon={CheckCircle2} color="#16A34A" bg="#F0FDF4" trend="up" />
        <StatCard label="Critical Active"     value={stats?.criticalReports ?? 0}  icon={AlertCircle}  color="#DC2626" bg="#FEF2F2" trend="down" />
        <StatCard label="Resolution Rate"     value={`${resolutionRate}%`}          icon={Activity}     color="#7C3AED" bg="#F5F3FF" trend={resolutionRate >= 60 ? "up" : "down"} />
      </div>

      {/* Weekly Trend Chart */}
      <div className="card-base bg-white dark:bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <SectionHeader title="Weekly Report Volume" subtitle="Reports submitted vs resolved per week" />
        </div>
        <div className="p-3 sm:p-5">
          {trendsLoading ? (
            <div className="h-56 skeleton rounded-xl" />
          ) : weeklyData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">No trend data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={weeklyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad-reported" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="grad-resolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#16A34A" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))", border: "1px solid hsl(var(--border))",
                    borderRadius: 10, fontSize: 12
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Area type="monotone" dataKey="reported" name="Reported" stroke="#2563EB" strokeWidth={2} fill="url(#grad-reported)" dot={{ r: 3, fill: "#2563EB" }} />
                <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#16A34A" strokeWidth={2} fill="url(#grad-resolved)" dot={{ r: 3, fill: "#16A34A" }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Two column: Civic Health + Authority Performance */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Civic Health Scores */}
        <div className="card-base bg-white dark:bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <SectionHeader title="Civic Health by Neighbourhood" subtitle="AI-computed score out of 100" />
          </div>
          <div className="p-3 sm:p-5 space-y-3">
            {healthLoading ? (
              [...Array(3)].map((_, i) => <div key={i} className="h-14 skeleton rounded-xl" />)
            ) : !civicHealth?.length ? (
              <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">No health data</div>
            ) : (civicHealth as any[]).map((item: any, i: number) => {
              const trendIcon = item.trend === "improving" ? "↑" : item.trend === "declining" ? "↓" : "→";
              const trendColor = item.trend === "improving" ? "text-emerald-600" : item.trend === "declining" ? "text-red-500" : "text-muted-foreground";
              const barColor = item.score >= 75 ? "#16A34A" : item.score >= 55 ? "#F59E0B" : "#DC2626";
              return (
                <motion.div key={item.neighborhood} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">{item.neighborhood}</span>
                      <span className={`text-xs font-bold ${trendColor}`}>{trendIcon}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{item.issueCount} issues</span>
                      <span className="font-bold text-foreground">{item.score}/100</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.score}%` }}
                      transition={{ duration: 0.7, delay: i * 0.1 }}
                      className="h-full rounded-full"
                      style={{ background: barColor }}
                    />
                  </div>
                  {item.primaryIssue && (
                    <p className="text-[11px] text-muted-foreground">Primary: {item.primaryIssue}</p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Authority Performance */}
        <div className="card-base bg-white dark:bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <SectionHeader title="Authority Performance" subtitle="Department response & resolution metrics" />
          </div>
          <div className="p-3 sm:p-5 space-y-4">
            {authorityLoading ? (
              [...Array(2)].map((_, i) => <div key={i} className="h-20 skeleton rounded-xl" />)
            ) : !authorityPerf?.length ? (
              <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">No performance data</div>
            ) : (authorityPerf as any[]).map((dept: any, i: number) => {
              const perfColor = dept.performanceScore >= 80 ? "#16A34A" : dept.performanceScore >= 60 ? "#F59E0B" : "#DC2626";
              const trendIcon = dept.trend === "improving" ? <TrendingUp className="w-3 h-3 text-emerald-600" /> : dept.trend === "declining" ? <TrendingDown className="w-3 h-3 text-red-500" /> : <Minus className="w-3 h-3 text-muted-foreground" />;
              return (
                <motion.div key={dept.department} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  className="p-4 rounded-xl border border-border bg-muted/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <Building2 className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span className="text-sm font-semibold text-foreground">{dept.department}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {trendIcon}
                      <span className="text-sm font-bold" style={{ color: perfColor }}>{dept.performanceScore}%</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-lg font-bold text-foreground">{dept.assignedCount}</div>
                      <div className="text-[10px] text-muted-foreground">Assigned</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-emerald-600">{dept.resolvedCount}</div>
                      <div className="text-[10px] text-muted-foreground">Resolved</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-foreground">{dept.avgResolutionDays}d</div>
                      <div className="text-[10px] text-muted-foreground">Avg Time</div>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${dept.performanceScore}%` }}
                      transition={{ duration: 0.6, delay: i * 0.1 }}
                      className="h-full rounded-full"
                      style={{ background: perfColor }}
                    />
                  </div>
                  {dept.pendingCritical > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px] text-red-500">
                      <AlertCircle className="w-3 h-3" />
                      <span>{dept.pendingCritical} critical issue{dept.pendingCritical > 1 ? "s" : ""} pending</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Category Trends Bar Chart */}
      {!trendsLoading && categoryTrends.length > 0 && (
        <div className="card-base bg-white dark:bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <SectionHeader title="Category Trends" subtitle="This week vs last week by issue type" />
          </div>
          <div className="p-3 sm:p-5">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={categoryTrends} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="category" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Bar dataKey="thisWeek" name="This Week" fill="#2563EB" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lastWeek" name="Last Week" fill="#94A3B8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

    </div>
  );
}
