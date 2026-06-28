import { useCreateReport, useAnalyzeReport } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { UploadCloud, X, Loader2, CheckCircle2, Brain, Zap, Shield, MapPin, Eye, Tag, Navigation, Phone, Crosshair } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  ward: z.string().optional(),
  mohalla: z.string().optional(),
  address: z.string().optional(),
  pincode: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const AGENTS = [
  { name: "Vision Agent",         icon: Eye,          desc: "Analyzing image evidence",        color: "#0ea5e9" },
  { name: "Classification Agent", icon: Tag,          desc: "Categorizing issue type",          color: "#8b5cf6" },
  { name: "Geospatial Agent",     icon: MapPin,       desc: "Mapping location & hotspots",      color: "#10b981" },
  { name: "Duplicate Agent",      icon: Shield,       desc: "Checking for duplicates",          color: "#f59e0b" },
  { name: "Priority Agent",       icon: Zap,          desc: "Calculating urgency score",        color: "#ef4444" },
  { name: "Routing Agent",        icon: Navigation,   desc: "Assigning to authority",           color: "#ec4899" },
  { name: "Predictive Agent",     icon: Brain,        desc: "Forecasting resolution timeline",  color: "#14b8a6" },
  { name: "Resolution Advisor",   icon: CheckCircle2, desc: "Generating action plan",           color: "#a3e635" },
];

export default function Report() {
  const [, setLocation] = useLocation();
  const createReport = useCreateReport();
  const analyzeReport = useAnalyzeReport();
  const queryClient = useQueryClient();
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [pipelineReportId, setPipelineReportId] = useState<number | null>(null);
  const [activeAgents, setActiveAgents] = useState<number[]>([]);
  const [completedAgents, setCompletedAgents] = useState<number[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "", description: "", ward: "", mohalla: "",
      address: "", pincode: "", city: "", state: "",
      latitude: undefined, longitude: undefined,
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImageBase64(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => setImageBase64(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Animate agents sequentially while real API runs
  const animateAgents = () => {
    AGENTS.forEach((_, i) => {
      setTimeout(() => {
        setActiveAgents(prev => [...prev, i]);
        setTimeout(() => setCompletedAgents(prev => [...prev, i]), 700);
      }, i * 600);
    });
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("error");
      return;
    }
    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLocationCoords({ lat, lng });
        setLocationStatus("success");
        // Reverse geocode using free Nominatim API (no key needed)
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
          .then(r => r.json())
          .then(data => {
            if (data.address) {
              const a = data.address;
              const road = a.road || a.pedestrian || a.footway || "";
              const suburb = a.suburb || a.neighbourhood || a.village || "";
              const city = a.city || a.town || a.county || "";
              const postcode = a.postcode || "";
              const state = a.state || "";
              if (road) form.setValue("address", road);
              if (suburb) form.setValue("mohalla", suburb);
              if (city) form.setValue("city", city);
              if (postcode) form.setValue("pincode", postcode.replace(/\s/g, "").slice(0, 6));
              if (state) form.setValue("state", state);
            }
          })
          .catch(() => {}); // silently ignore if reverse geocode fails
      },
      () => setLocationStatus("error"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const onSubmit = async (values: FormValues) => {
  try {
    const fullAddress = [
      values.address,
      values.ward ? `Ward ${values.ward}` : "",
      values.mohalla,
      values.city,
      values.pincode,
      values.state,
    ].filter(Boolean).join(", ");

    const res = await createReport.mutateAsync({
      data: {
        title: values.title,
        description: values.description,
        imageBase64,
        address: fullAddress,
        neighborhood: values.mohalla,
        reporterName: "",
        latitude: locationCoords?.lat ?? null,
        longitude: locationCoords?.lng ?? null,
      },
    });

    // ✅ Pehle screen dikhao — user ko wait nahi karna
    setPipelineReportId(res.id);
    animateAgents();

    // ✅ Analysis background mein — await nahi, .then() se handle karo
    analyzeReport.mutateAsync({ id: res.id })
      .then(async () => {
        await queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
        await queryClient.invalidateQueries({ queryKey: ["/api/analytics/dashboard"] });
      })
      .catch((err) => console.error("Analysis error:", err));

    // ✅ 5.5s baad redirect — analysis ka wait nahi
    setTimeout(() => setLocation(`/track/${res.id}`), 5500);

  } catch (err) {
    console.error(err);
  }
};

  // ── Pipeline view ──
  if (pipelineReportId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-3 sm:p-6 bg-background grid-bg">
        <div className="w-full max-w-2xl space-y-6">

          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-[10px] font-mono tracking-widest mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              AI PIPELINE ACTIVE
            </div>
            <h1 className="text-2xl font-bold font-mono text-foreground">
              Analyzing Report <span className="text-primary">#{pipelineReportId}</span>
            </h1>
            <p className="text-muted-foreground text-sm">
              8 intelligence agents processing your submission simultaneously
            </p>
          </motion.div>

          {/* Progress bar */}
          <div className="rounded-xl border border-border/60 bg-card/50 p-4 overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
            <div className="h-1.5 rounded-full bg-border overflow-hidden mb-4 relative">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: "0%" }}
                animate={{ width: `${(completedAgents.length / AGENTS.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
              <div className="absolute inset-0 scan-bar overflow-hidden rounded-full" />
            </div>
            <div className="text-right text-[10px] font-mono text-muted-foreground">
              {completedAgents.length}/{AGENTS.length} agents complete
            </div>
          </div>

          {/* Agent cards grid */}
          <div className="grid grid-cols-2 gap-3">
            {AGENTS.map((agent, i) => {
              const Icon = agent.icon;
              const isActive = activeAgents.includes(i);
              const isDone = completedAgents.includes(i);
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{
                    opacity: isActive ? 1 : 0.3,
                    scale: isActive ? 1 : 0.96,
                  }}
                  transition={{ duration: 0.35, delay: i * 0.05 }}
                  className="rounded-xl border bg-card/60 p-3 flex items-start gap-3 relative overflow-hidden"
                  style={{
                    borderColor: isDone ? `${agent.color}40` : "rgba(255,255,255,0.08)",
                    boxShadow: isDone ? `0 0 16px ${agent.color}20` : "none",
                  }}
                >
                  {isDone && (
                    <div
                      className="absolute inset-0 opacity-[0.03]"
                      style={{ background: agent.color }}
                    />
                  )}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${agent.color}15` }}
                  >
                    {isDone
                      ? <CheckCircle2 className="w-4 h-4" style={{ color: agent.color }} />
                      : isActive
                      ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: agent.color }} />
                      : <Icon className="w-4 h-4 text-muted-foreground/40" />
                    }
                  </div>
                  <div>
                    <div className="text-xs font-semibold font-mono" style={{ color: isActive ? agent.color : undefined }}>
                      {agent.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{agent.desc}</div>
                  </div>
                  {isDone && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: `${agent.color}20` }}
                    >
                      <CheckCircle2 className="w-3 h-3" style={{ color: agent.color }} />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Completion message */}
          <AnimatePresence>
            {analyzeReport.isSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-emerald-500/30 bg-emerald-500/8 p-4 text-center"
              >
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="font-mono text-sm font-bold text-emerald-400">ANALYSIS COMPLETE</p>
                <p className="text-xs text-muted-foreground mt-1">Redirecting to intelligence dashboard...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // ── Form view ──
  return (
    <div className="max-w-3xl mx-auto p-3 sm:p-5 md:p-8">

      {/* Header */}
      <div className="mb-5 sm:mb-7">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-5 rounded-full bg-primary" />
          <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-tight">REPORT AN ISSUE</h1>
        </div>
        <p className="text-muted-foreground text-xs font-mono ml-3.5">
          Submit civic infrastructure anomalies · AI classification in seconds
        </p>
      </div>

      <div className="rounded-xl border border-border/60 bg-card/50 backdrop-blur overflow-hidden">
        {/* Top scan line */}
        <div className="h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

        <div className="p-4 sm:p-6 md:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              {/* ── SECTION 1: Image upload ── */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-primary tracking-widest">SECTION 1</span>
                  <div className="flex-1 h-px bg-border/60" />
                  <span className="text-[10px] text-muted-foreground font-mono">VISUAL EVIDENCE</span>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-mono tracking-wider text-muted-foreground">TASVEER (OPTIONAL)</Label>
                  <div
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer ${
                      isDragOver
                        ? "border-primary bg-primary/5 scale-[1.01]"
                        : imageBase64
                        ? "border-primary/50 bg-primary/5"
                        : "border-border hover:border-primary/40 hover:bg-primary/[0.02]"
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                  >
                    <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
                    {imageBase64 ? (
                      <div className="relative inline-block">
                        <img src={imageBase64} alt="Preview" className="max-h-44 rounded-lg border border-border/60" />
                        <button
                          type="button"
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive flex items-center justify-center"
                          onClick={(e) => { e.stopPropagation(); setImageBase64(null); }}
                        >
                          <X className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-xl border border-border/60 bg-card flex items-center justify-center mb-1">
                          <UploadCloud className="w-5 h-5 text-primary/60" />
                        </div>
                        <p className="text-sm font-mono font-medium text-foreground">Drop image or click to upload</p>
                        <p className="text-[11px] text-muted-foreground">PNG · JPG · GIF · up to 10MB</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── SECTION 2: Issue Details ── */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-primary tracking-widest">SECTION 2</span>
                  <div className="flex-1 h-px bg-border/60" />
                  <span className="text-[10px] text-muted-foreground font-mono">SAMASYA VIVARAN (ISSUE DETAILS)</span>
                </div>

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-mono tracking-wider text-muted-foreground">ISSUE TITLE</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Severe pothole on Main St"
                          {...field}
                          className="bg-background/50 border-border/60 font-mono text-sm focus:border-primary/50 focus:ring-primary/20"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-mono tracking-wider text-muted-foreground">DETAILED DESCRIPTION</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the severity, exact location, and any safety risks in detail..."
                          {...field}
                          className="bg-background/50 border-border/60 min-h-[110px] font-mono text-sm focus:border-primary/50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* ── SECTION 3: Location ── */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-primary tracking-widest">SECTION 3</span>
                  <div className="flex-1 h-px bg-border/60" />
                  <span className="text-[10px] text-muted-foreground font-mono">JAGAH (LOCATION)</span>
                </div>

                {/* GPS Button */}
                <div className="space-y-2">
                  <label className="text-xs font-mono tracking-wider text-muted-foreground">JAGAH / LOCATION</label>
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={locationStatus === "loading"}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed text-sm font-semibold transition-all ${
                      locationStatus === "success"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-600"
                        : locationStatus === "error"
                        ? "border-red-400 bg-red-500/10 text-red-500"
                        : locationStatus === "loading"
                        ? "border-primary/40 bg-primary/5 text-primary"
                        : "border-primary/30 hover:border-primary bg-primary/5 hover:bg-primary/10 text-primary"
                    }`}
                  >
                    {locationStatus === "loading" ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> GPS se location dhundh raha hai...</>
                    ) : locationStatus === "success" ? (
                      <><CheckCircle2 className="w-4 h-4" /> Location mili! ({locationCoords?.lat.toFixed(4)}, {locationCoords?.lng.toFixed(4)})</>
                    ) : locationStatus === "error" ? (
                      <><Crosshair className="w-4 h-4" /> Location nahi mili — manually bharein</>
                    ) : (
                      <><Crosshair className="w-4 h-4" /> 📍 Apni Current Location Use Karein (GPS)</>
                    )}
                  </button>
                  {locationStatus === "success" && (
                    <p className="text-[11px] text-emerald-600 text-center">
                      ✓ Address fields auto-fill ho gaye — check karein aur theek karein
                    </p>
                  )}
                  {locationStatus === "error" && (
                    <p className="text-[11px] text-red-500 text-center">
                      Browser ne location deny ki — manually bharein ya browser settings mein location allow karein
                    </p>
                  )}
                </div>

                {/* Ward + Mohalla */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="ward"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-mono tracking-wider text-muted-foreground">WARD NO.</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 14, 14B" {...field} className="bg-background/50 border-border/60 focus:border-primary/50" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mohalla"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-mono tracking-wider text-muted-foreground">MOHALLA / COLONY</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Laxmi Nagar, Sector 7" {...field} className="bg-background/50 border-border/60 focus:border-primary/50" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Full Address */}
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-mono tracking-wider text-muted-foreground">POORA PATA (FULL ADDRESS)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Plot 45, Near Hanuman Mandir, MG Road" {...field} className="bg-background/50 border-border/60 focus:border-primary/50" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* City + Pincode + State */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-mono tracking-wider text-muted-foreground">SHAHAR (CITY)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Lucknow" {...field} className="bg-background/50 border-border/60 focus:border-primary/50" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pincode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-mono tracking-wider text-muted-foreground">PIN CODE</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 226001" {...field} maxLength={6} className="bg-background/50 border-border/60 focus:border-primary/50" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-mono tracking-wider text-muted-foreground">RAJYA (STATE)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Uttar Pradesh" {...field} className="bg-background/50 border-border/60 focus:border-primary/50" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* AI notice */}
              <div className="flex items-start gap-3 p-3 rounded-lg border border-primary/15 bg-primary/5">
                <Brain className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-mono text-primary font-semibold">AI PIPELINE WILL ACTIVATE</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">8 intelligent agents will analyze, classify, prioritize and route your report automatically.</p>
                </div>
              </div>

              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Button
                  type="submit"
                  className="w-full font-mono font-bold tracking-widest text-sm py-6 bg-primary hover:bg-primary/90 relative overflow-hidden group"
                  size="lg"
                  disabled={createReport.isPending}
                >
                  {createReport.isPending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> SUBMITTING...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Zap className="w-4 h-4" /> INITIALIZE REPORT
                    </span>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </Button>
              </motion.div>

            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
