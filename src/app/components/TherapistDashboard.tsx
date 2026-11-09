import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Copy,
  FileText,
  LockKeyhole,
  ShoppingBag,
  Search,
  Send,
  Settings2,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useNavigate } from "react-router";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import officialLogo from "../../imports/2.png";
import { ClientDirectory, MonitoringPanel, ProgramBuilder, type DirectoryClient } from "./PractitionerMonitoring";

interface TherapistDashboardProps {
  onBackToCheckIn: () => void;
  onOpenNDMAPS?: () => void;
  onOpenInventory?: () => void;
}

const clients: DirectoryClient[] = [
  { id: "C-1001", name: "Alex Morgan", initials: "AM", age: 34, programs: ["Sleep", "Weekly PulseKey"], nextAppointment: "Nov 19", status: "review due", focus: "Sleep and energy improving", score: 76, change: 8, updated: "Today", color: "#D9F06F", question: "Can we review my supplement timing?" },
  { id: "PK-PRIYA-01", name: "Priya Shah", initials: "PS", age: 42, programs: ["Sleep"], nextAppointment: "Nov 10", status: "clinical review", focus: "Sleep declined · visit in 2 days", score: 48, change: -7, updated: "Today", color: "#F8C7BE" },
  { id: "PK-JORDAN-01", name: "Jordan Ellis", initials: "JE", age: 29, programs: ["Energy & fatigue"], nextAppointment: "Nov 22", status: "message pending", focus: "Cost and time barriers · new question", score: 64, change: 3, updated: "Yesterday", color: "#A9E7E2" },
  { id: "PK-OMAR-01", name: "Omar Lee", initials: "OL", age: 51, programs: ["Sleep"], nextAppointment: "Nov 28", status: "follow-up due", focus: "Follow-up overdue · 2 missed check-ins", score: 51, change: -2, updated: "17 days ago", color: "#FFD19D" },
  { id: "PK-SAM-01", name: "Sam Rivera", initials: "SR", age: 37, programs: ["Anxiety", "Weekly PulseKey"], nextAppointment: "Nov 16", status: "question pending", focus: "Anxiety varies with work transitions", score: 58, change: -4, updated: "2 days ago", color: "#D6CBFF", question: "Could we review which coping strategy to use during work transitions?" },
  { id: "PK-TAYLOR-01", name: "Taylor Brooks", initials: "TB", age: 31, programs: ["Mood"], nextAppointment: "Dec 2", status: "up to date", focus: "Strong goal participation", score: 82, change: 11, updated: "3 days ago", color: "#BDE7C9" },
  { id: "PK-MORGAN-01", name: "Morgan Chen", initials: "MC", age: 45, programs: ["Sleep", "Anxiety", "Treatment adherence"], nextAppointment: "Nov 21", status: "active monitoring", focus: "Sleep and anxiety fluctuate on busy workdays", score: 62, change: 1, updated: "4 days ago", color: "#C7DBF5", question: "My anxiety is lower on days after better sleep." },
  { id: "PK-JAMIE-01", name: "Jamie Laurent", initials: "JL", age: 39, programs: ["Mood", "Sleep"], nextAppointment: "Nov 25", status: "active monitoring", focus: "Mood improved · sleep inconsistent", score: 69, change: 5, updated: "5 days ago", color: "#E8D4F8" },
];

const progressData = [
  { week: "May 6", wellbeing: 52, agency: 47 },
  { week: "May 13", wellbeing: 56, agency: 51 },
  { week: "May 20", wellbeing: 54, agency: 58 },
  { week: "May 27", wellbeing: 63, agency: 61 },
  { week: "Jun 3", wellbeing: 68, agency: 66 },
  { week: "Jun 10", wellbeing: 72, agency: 74 },
];

const recommendations = [
  {
    id: 1,
    client: "Maya Chen",
    title: "Create a written transition plan",
    detail: "Share a simple three-step plan before schedule changes.",
    status: "Pending",
  },
  {
    id: 2,
    client: "Sam Rivera",
    title: "Protect a low-stimulation window",
    detail: "Trial a 20-minute quiet reset after high-input activities.",
    status: "Pending",
  },
  {
    id: 3,
    client: "Jordan Ellis",
    title: "Use an energy check before planning",
    detail: "Choose the day’s priorities after a quick 1–5 energy rating.",
    status: "Approved",
  },
];

export function TherapistDashboard({ onBackToCheckIn, onOpenNDMAPS, onOpenInventory }: TherapistDashboardProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [range, setRange] = useState("6 weeks");
  const [approved, setApproved] = useState<number[]>([3]);
  const [selectedClient, setSelectedClient] = useState(clients[0]);
  const [workspace, setWorkspace] = useState<"today" | "directory" | "client" | "programs" | "followups">("today");
  const [practiceMode, setPracticeMode] = useState<"nd" | "therapy">("nd");
  const [latestShared] = useState<{
    dayWords?: string[];
    stress?: number;
    burnout?: number;
    drawingCompleted?: number;
    voiceCompleted?: number;
    shareScores?: boolean;
    shareReflections?: boolean;
    reflections?: string[];
  } | null>(() => {
    try {
      const saved = window.localStorage.getItem("pulsekey-latest");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const filteredClients = useMemo(
    () =>
      clients.filter((client) =>
        `${client.name} ${client.focus}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  );

  const toggleApproval = (id: number) => {
    setApproved((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  if (workspace === "client") {
    return (
      <ClientWorkspace
        client={selectedClient}
        practiceMode={practiceMode}
        latestShared={latestShared}
        onBack={() => setWorkspace("today")}
             />
    );
  }

  if (workspace === "directory") {
    return <ClientDirectory clients={clients} onBack={() => setWorkspace("today")} onOpen={(client) => { setSelectedClient(client); setWorkspace("client"); }} />;
  }

  if (workspace === "programs") {
    return (
      <ProgramBuilder
        clients={clients}
        initialClient={selectedClient}
        onBack={() => setWorkspace("today")}
             />
    );
  }

  if (workspace === "followups") {
    return <FollowUpWorkspace onBack={() => setWorkspace("today")} />;
  }

  return (
    <div className="min-h-screen bg-[#0B3D55] text-white">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_78%_12%,rgba(77,213,194,0.36),transparent_28%),radial-gradient(circle_at_8%_80%,rgba(29,128,142,0.35),transparent_34%),linear-gradient(145deg,#0B3D55_0%,#0E5369_54%,#169A94_100%)]" />
      <div className="relative mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[250px_1fr]">
        <aside className="hidden border-r border-white/10 bg-[#062E43]/55 px-5 py-7 backdrop-blur-xl lg:flex lg:flex-col">
          <button onClick={() => navigate("/")} title="Return to demo home" className="mb-10 block w-full rounded-xl bg-white p-3 text-left transition hover:ring-2 hover:ring-[#17A7A3]">
            <ImageWithFallback src={officialLogo} alt="mentAImage official logo" className="h-8 w-auto object-contain" />
            <p className="mt-2 border-t border-[#123F52]/10 pt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#426874]">PulseKey™ for Practitioners</p>
          </button>

          <nav className="space-y-2" aria-label="Therapist navigation">
            <button onClick={() => setWorkspace("today")} className="flex w-full items-center gap-3 rounded-xl bg-white/12 px-4 py-3 text-sm font-semibold shadow-inner shadow-white/5">
              <Activity className="size-4 text-[#D9F06F]" />
              Today
            </button>
            <button onClick={() => setWorkspace("directory")} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/65 transition hover:bg-white/8 hover:text-white">
              <Users className="size-4" />
              Clients
            </button>
            <button onClick={() => setWorkspace("followups")} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/65 transition hover:bg-white/8 hover:text-white">
              <ClipboardCheck className="size-4" />
              Appointments & Follow-ups
            </button>
            <button onClick={() => setWorkspace("programs")} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/65 transition hover:bg-white/8 hover:text-white">
              <Settings2 className="size-4" />
              Check-in Programs
            </button>
            {onOpenInventory && <button onClick={onOpenInventory} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/65 transition hover:bg-white/8 hover:text-white"><ShoppingBag className="size-4" />Inventory &amp; Orders</button>}
            {onOpenNDMAPS && <button onClick={onOpenNDMAPS} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/65 transition hover:bg-white/8 hover:text-white"><BarChart3 className="size-4" />PulseKey clinical hub</button>}
          </nav>

          <div className="mt-auto rounded-2xl border border-white/10 bg-white/8 p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-[#D9F06F]">
              <LockKeyhole className="size-4" />
              Consent protected
            </div>
            <p className="text-xs leading-relaxed text-white/55">
              This view only includes information clients have chosen to share.
            </p>
          </div>
        </aside>

        <main className="min-w-0 px-4 py-5 sm:px-7 sm:py-7 xl:px-10">
          <header className="mb-7 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 lg:hidden">
              <button onClick={() => navigate("/")} title="Return to demo home" className="rounded-xl bg-white p-2 hover:ring-2 hover:ring-[#17A7A3]">
                <ImageWithFallback src={officialLogo} alt="mentAImage official logo" className="h-6 w-auto object-contain" />
              </button>
            </div>
            <div className="hidden lg:block">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D9F06F]">
                Monday, June 17
              </p>
              <h1 className="font-display mt-1 text-3xl font-semibold tracking-tight xl:text-4xl">
                Good morning, Dr. Avery Morgan
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden rounded-xl border border-white/15 bg-white/8 p-1 sm:flex">
                <button onClick={() => setPracticeMode("nd")} className={`rounded-lg px-3 py-2 text-xs font-bold ${practiceMode === "nd" ? "bg-white text-[#123F52]" : "text-white/55"}`}>ND practice</button>
                <button onClick={() => setPracticeMode("therapy")} className={`rounded-lg px-3 py-2 text-xs font-bold ${practiceMode === "therapy" ? "bg-white text-[#123F52]" : "text-white/55"}`}>Therapy</button>
              </div>
            </div>
          </header>

          <div className="mb-6 lg:hidden">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D9F06F]">Therapist overview</p>
            <h1 className="font-display mt-1 text-3xl font-semibold tracking-tight">Good morning, Dr. Avery Morgan</h1>
          </div>

          {latestShared?.shareScores && (
            <button
              onClick={() => {
                setSelectedClient(clients[0]);
                setWorkspace("client");
              }}
              className="mb-6 flex w-full flex-col justify-between gap-4 rounded-2xl border border-[#D9F06F]/25 bg-[#D9F06F]/12 p-4 text-left transition hover:bg-[#D9F06F]/17 sm:flex-row sm:items-center"
            >
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#D9F06F] text-[#123F52]"><CheckCircle2 className="size-5" /></span>
                <div><p className="font-bold">New shared PulseKey™ from Alex Morgan</p><p className="mt-1 text-xs text-white/52">{latestShared.dayWords?.join(", ")} · Stress {latestShared.stress}/10 · Burnout {latestShared.burnout}/5 · raw media remains private</p></div>
              </div>
              <span className="flex items-center gap-1 text-xs font-bold text-[#E8F79D]">Review shared update <ChevronRight className="size-4" /></span>
            </button>
          )}

          <section className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-5">
            {[
              { label: "Active clients", value: "24", note: "Fictional demo", icon: Users },
              { label: "New check-ins", value: "8", note: "Since last review", icon: CalendarDays },
              { label: "Upcoming sessions", value: "5", note: "Next 7 days", icon: Activity },
              { label: "Follow-ups due", value: "4", note: "Review before reminder", icon: ClipboardCheck },
              { label: "Questions", value: "3", note: "Awaiting review", icon: Sparkles },
            ].map((stat) => (
              <article
                key={stat.label}
                className="rounded-2xl border border-white/14 bg-white/10 p-4 shadow-xl shadow-[#032737]/10 backdrop-blur-xl sm:p-5"
              >
                <div className="mb-5 flex items-start justify-between">
                  <p className="text-xs leading-tight text-white/58 sm:text-sm">{stat.label}</p>
                  <stat.icon className="size-4 text-[#D9F06F]" />
                </div>
                <p className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{stat.value}</p>
                <p className="mt-1 text-[11px] text-white/48 sm:text-xs">{stat.note}</p>
              </article>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
            <div className="min-w-0 space-y-6">
              <article className="rounded-3xl border border-white/14 bg-white/10 p-4 shadow-2xl shadow-[#032737]/15 backdrop-blur-xl sm:p-6">
                <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#D9F06F]">Selected client</p>
                    <h2 className="font-display mt-1 text-2xl font-semibold">{selectedClient.name}&apos;s progress</h2>
                    <p className="mt-1 text-sm text-white/50">Consented wellbeing and agency trends · {selectedClient.focus}</p>
                  </div>
                  <label className="relative">
                    <span className="sr-only">Chart range</span>
                    <select
                      value={range}
                      onChange={(event) => setRange(event.target.value)}
                      className="appearance-none rounded-xl border border-white/14 bg-[#0A4258]/80 py-2.5 pl-4 pr-9 text-sm text-white outline-none focus:ring-2 focus:ring-[#D9F06F]"
                    >
                      <option>6 weeks</option>
                      <option>3 months</option>
                      <option>6 months</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-white/60" />
                  </label>
                </div>

                <div className="h-[250px] w-full sm:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={progressData} margin={{ top: 8, right: 6, left: -24, bottom: 0 }}>
                      <defs key="practitioner-chart-defs">
                        <linearGradient id="wellbeing" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#D9F06F" stopOpacity={0.38} />
                          <stop offset="100%" stopColor="#D9F06F" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid key="practitioner-grid" stroke="rgba(255,255,255,.09)" vertical={false} />
                      <XAxis key="practitioner-x" dataKey="week" tick={{ fill: "rgba(255,255,255,.48)", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis key="practitioner-y" domain={[30, 90]} tick={{ fill: "rgba(255,255,255,.42)", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        key="practitioner-tooltip"
                        contentStyle={{ background: "#07384D", border: "1px solid rgba(255,255,255,.14)", borderRadius: 12, color: "white" }}
                        labelStyle={{ color: "rgba(255,255,255,.65)" }}
                      />
                      <Area key="practitioner-wellbeing" id="practitioner-wellbeing-area" isAnimationActive={false} type="monotone" dataKey="wellbeing" name="Wellbeing" stroke="#D9F06F" strokeWidth={3} fill="url(#wellbeing)" />
                      <Area key="practitioner-agency" id="practitioner-agency-area" isAnimationActive={false} type="monotone" dataKey="agency" name="Agency" stroke="#8AE2DC" strokeWidth={2} fill="transparent" strokeDasharray="5 5" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 flex items-center gap-5 text-xs text-white/60">
                  <span className="flex items-center gap-2"><i className="h-0.5 w-5 bg-[#D9F06F]" />Wellbeing</span>
                  <span className="flex items-center gap-2"><i className="h-0.5 w-5 border-t-2 border-dashed border-[#8AE2DC]" />Agency</span>
                </div>
              </article>

              <article className="rounded-3xl border border-white/14 bg-white/10 p-4 backdrop-blur-xl sm:p-6">
                <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="font-display text-2xl font-semibold">Priority for today</h2>
                    <p className="mt-1 text-sm text-white/50">Review changes, requests and follow-up opportunities</p>
                  </div>
                  <label className="relative">
                    <Search className="absolute left-3 top-2.5 size-4 text-white/45" />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Find a client"
                      className="w-full rounded-xl border border-white/12 bg-black/10 py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/35 outline-none focus:ring-2 focus:ring-[#D9F06F] sm:w-48"
                    />
                  </label>
                </div>
                <div className="divide-y divide-white/10">
                  {filteredClients.map((client) => (
                    <button
                      key={client.name}
                      onClick={() => {
                        setSelectedClient(client);
                        setWorkspace("client");
                      }}
                      className={`grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl px-2 py-4 text-left transition first:pt-2 last:pb-2 sm:gap-4 ${
                        selectedClient.name === client.name ? "bg-white/10" : "hover:bg-white/5"
                      }`}
                    >
                      <div className="grid size-10 place-items-center rounded-full text-xs font-bold text-[#123D4D]" style={{ backgroundColor: client.color }}>
                        {client.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{client.name}</p>
                        <p className="truncate text-xs text-white/45">{client.focus} · {client.updated}</p>
                      </div>
                      <div className="flex items-center gap-3 sm:gap-5">
                        <div className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-white/10 sm:block">
                          <div className="h-full rounded-full bg-[#D9F06F]" style={{ width: `${client.score}%` }} />
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{client.score}</p>
                          <p className={`text-[10px] ${client.change >= 0 ? "text-[#D9F06F]" : "text-[#FFB6A8]"}`}>
                            {client.change >= 0 ? "+" : ""}{client.change} pts
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </article>
            </div>

            <aside className="rounded-3xl border border-white/14 bg-[#F4F7EB] p-5 text-[#123A49] shadow-2xl shadow-[#032737]/20 sm:p-6">
              <div className="mb-5 rounded-2xl border border-[#D77B68]/25 bg-[#FFF0EA] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#A54837]">
                    <AlertTriangle className="size-4" />
                    Priority area
                  </div>
                  <span className="rounded-full bg-[#F8D3C9] px-2 py-1 text-[10px] font-bold text-[#8E3D31]">REVIEW SOON</span>
                </div>
                <h3 className="font-display mt-3 text-xl font-semibold">Unexpected transitions</h3>
                <p className="mt-2 text-xs leading-relaxed text-[#765C56]">
                  Distress appeared in 3 of {selectedClient.name}&apos;s last 4 check-ins, most often after last-minute schedule changes.
                </p>
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/70 p-3 text-xs font-semibold text-[#70483F]">
                  <Target className="size-4 text-[#A54837]" />
                  Explore a shared transition plan next session
                </div>
              </div>
              <div className="mb-6 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#177D78]">Clinical review</p>
                  <h2 className="font-display mt-1 text-2xl font-semibold">Recommendations</h2>
                </div>
                <span className="rounded-full bg-[#DDE8CB] px-3 py-1 text-xs font-bold">{recommendations.length}</span>
              </div>
              <p className="mb-5 text-sm leading-relaxed text-[#45626C]">
                AI-assisted ideas remain private until you review and approve them.
              </p>
              <div className="space-y-3">
                {recommendations.map((item) => {
                  const isApproved = approved.includes(item.id);
                  return (
                    <div key={item.id} className="rounded-2xl border border-[#123A49]/10 bg-white/65 p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <span className="text-xs font-bold text-[#177D78]">{item.client}</span>
                        <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${isApproved ? "bg-[#DCEBB8] text-[#436118]" : "bg-[#FFE4C5] text-[#8A511B]"}`}>
                          {isApproved ? "Approved" : "Pending"}
                        </span>
                      </div>
                      <h3 className="font-display text-lg font-semibold leading-tight">{item.title}</h3>
                      <p className="mt-2 text-xs leading-relaxed text-[#58717A]">{item.detail}</p>
                      <button
                        onClick={() => toggleApproval(item.id)}
                        className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-[#177D78] focus:ring-offset-2 ${
                          isApproved ? "bg-[#E4E9DC] text-[#45626C] hover:bg-[#D8DED0]" : "bg-[#123A49] text-white hover:bg-[#1A5062]"
                        }`}
                      >
                        <Check className="size-3.5" />
                        {isApproved ? "Approved for client" : "Review & approve"}
                      </button>
                    </div>
                  );
                })}
              </div>
              <p className="mt-5 flex items-start gap-2 text-[11px] leading-relaxed text-[#6B7F86]">
                <LockKeyhole className="mt-0.5 size-3.5 shrink-0" />
                Recommendations are visible to a client only after therapist approval.
              </p>
            </aside>
          </section>
        </main>
      </div>
    </div>
  );
}

function PractitionerPageHeader({
  title,
  eyebrow,
  onBack,
}: {
  title: string;
  eyebrow: string;
  onBack: () => void;
}) {
  return (
    <header className="mb-7 flex flex-col justify-between gap-4 border-b border-[#123F52]/10 pb-6 sm:flex-row sm:items-center">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="grid size-10 place-items-center rounded-xl border border-[#123F52]/10 bg-white text-[#123F52] shadow-sm hover:bg-[#F1F7F5]">
          <ArrowLeft className="size-4" />
        </button>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.17em] text-[#17A7A3]">{eyebrow}</p>
          <h1 className="font-display mt-1 text-3xl font-semibold tracking-tight text-[#123F52]">{title}</h1>
        </div>
      </div>
      <button onClick={() => navigate("/")} title="Return to demo home" className="hidden rounded-xl bg-white p-2 shadow-sm sm:block hover:ring-2 hover:ring-[#17A7A3]">
        <ImageWithFallback src={officialLogo} alt="mentAImage official logo" className="h-7 w-auto object-contain" />
      </button>
    </header>
  );
}

function ClientWorkspace({
  client,
  practiceMode,
  latestShared,
  onBack,
}: {
  client: (typeof clients)[number];
  practiceMode: "nd" | "therapy";
  latestShared: {
    dayWords?: string[];
    stress?: number;
    burnout?: number;
    drawingCompleted?: number;
    voiceCompleted?: number;
    shareScores?: boolean;
    shareReflections?: boolean;
    reflections?: string[];
  } | null;
  onBack: () => void;
}) {
  const [tab, setTab] = useState("overview");
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [briefOpen, setBriefOpen] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [brief, setBrief] = useState(() => `${client.name} is currently monitored for ${client.programs.join(" and ").toLowerCase()}. ${client.focus}. Review recorded responses, missed check-ins and the patient-specific question before the next visit.`);
  const isAlex = client.id === "C-1001";
  const displayName = client.name;
  const summary = {
    improved: client.change > 0 ? [`Overall recorded progress increased ${client.change} points.`, `${client.programs[0]} monitoring has recent responses.`] : ["No clear improvement is established in the available responses."],
    challenges: client.change < 0 ? [`Overall recorded progress decreased ${Math.abs(client.change)} points.`, client.focus] : [client.focus],
    adherence: client.status.includes("missed") || client.focus.includes("missed") ? ["Scheduled responses are missing; review barriers before changing the plan."] : ["Recorded participation should be reviewed against the assigned schedule."],
    question: [client.question ? `"${client.question}"` : "No patient question is currently recorded."],
  };

  if (briefOpen) {
    return (
      <div className="min-h-screen bg-[#F4F8F6] p-4 text-[#20343C] sm:p-7 lg:p-10">
        <div className="mx-auto max-w-5xl">
          <PractitionerPageHeader title={`Prepare for ${displayName}'s next session`} eyebrow="AI-assisted draft · practitioner review required" onBack={() => setBriefOpen(false)} />
          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            <article className="rounded-3xl border border-[#123F52]/10 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#17A7A3]">Pre-visit brief</p>
                  <p className="mt-1 text-sm text-[#6B8087]">Sources: client reports, practitioner goals, AI-assisted summary</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${reviewed ? "bg-[#E7F7F1] text-[#147D79]" : "bg-[#FFF3D9] text-[#8B641D]"}`}>{reviewed ? "Reviewed" : "Draft"}</span>
              </div>
              <textarea value={brief} onChange={(event) => setBrief(event.target.value)} className="min-h-[150px] w-full rounded-2xl border border-[#123F52]/12 bg-[#F8FAF9] p-4 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-[#17A7A3]/30" />
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  ["Meaningful improvements", summary.improved.join(" ")],
                  ["Ongoing concerns", summary.challenges.join(" ")],
                  ["Client question", summary.question[0]],
                  ["Data limitations", `Only ${client.name}'s recorded responses are included. Missing responses are not interpolated.`],
                ].map(([title, body]) => (
                  <div key={title} className="rounded-2xl border border-[#123F52]/8 bg-[#F7FAF8] p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#55717A]">{title}</p>
                    <p className="mt-2 text-sm leading-relaxed">{body}</p>
                  </div>
                ))}
              </div>
            </article>
            <aside className="space-y-4">
              <div className="rounded-2xl border border-[#123F52]/10 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-[#55717A]">Discussion agenda</p>
                <div className="mt-4 space-y-3">
                  {[`Review ${client.programs[0]?.toLowerCase() || "monitoring"} responses`, "Review patient question", "Check plan practicality"].map((item) => (
                    <label key={item} className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-0.5 accent-[#17A7A3]" />{item}</label>
                  ))}
                </div>
              </div>
              <button onClick={() => setReviewed(true)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#123F52] px-4 py-3 text-sm font-bold text-white"><CheckCircle2 className="size-4" /> Mark review complete</button>
              <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#123F52]/12 bg-white px-4 py-3 text-sm font-bold text-[#123F52]"><Copy className="size-4" /> Copy summary</button>
              <p className="text-xs leading-relaxed text-[#7B8D92]">This draft is not a signed clinical note, diagnosis, prescription, or medical record.</p>
            </aside>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F8F6] p-4 text-[#20343C] sm:p-7 lg:p-10">
      <div className="mx-auto max-w-[1400px]">
        <PractitionerPageHeader title={displayName} eyebrow="Client workspace · fictional demo data" onBack={onBack} />
        <section className="mb-5 flex flex-col justify-between gap-5 rounded-3xl border border-[#123F52]/10 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:p-6">
          <div className="flex items-center gap-4">
            <div className="grid size-16 place-items-center rounded-full bg-[#D8F0E9] text-lg font-bold text-[#166F6C]">{client.initials}</div>
            <div>
              <div className="flex flex-wrap items-center gap-2"><h2 className="font-display text-2xl font-semibold text-[#123F52]">{displayName}</h2><span className="rounded-full bg-[#E7F7F1] px-2.5 py-1 text-[10px] font-bold text-[#147D79]">Sharing active</span></div>
              <p className="mt-1 text-sm text-[#687E85]">Age {client.age} · {client.id} · Dr. Avery Morgan · {client.programs.join(" + ")}</p>
              <p className="mt-1 text-xs text-[#8A999D]">Latest update {client.updated} · Next visit {client.nextAppointment}</p>
            </div>
          </div>
          <button onClick={() => setBriefOpen(true)} className="flex items-center justify-center gap-2 rounded-xl bg-[#123F52] px-5 py-3 text-sm font-bold text-white hover:bg-[#1A5367]"><FileText className="size-4" /> Prepare for visit</button>
        </section>

        <nav className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-[#123F52]/8 bg-white p-1.5 shadow-sm">
          {["overview", "monitoring", "since last visit", "trends", "goals & barriers", "check-in history", "follow-ups"].map((item) => (
            <button key={item} onClick={() => setTab(item)} className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-bold capitalize transition ${tab === item ? "bg-[#123F52] text-white" : "text-[#60777F] hover:bg-[#F1F7F5]"}`}>{item}</button>
          ))}
        </nav>

        {(tab === "overview" || tab === "since last visit") && (
          <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
            <article className="rounded-3xl border border-[#123F52]/10 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#17A7A3]">Since last visit</p><h2 className="font-display mt-2 text-3xl font-semibold text-[#123F52]">What changed since {displayName}&apos;s last appointment?</h2></div>
                <span className="rounded-full bg-[#FFF3D9] px-3 py-1.5 text-[10px] font-bold text-[#815D1C]">AI-ASSISTED · REVIEW REQUIRED</span>
              </div>
              <div className="mt-7 grid gap-5 md:grid-cols-2">
                {isAlex && latestShared?.shareScores && (
                  <div className="md:col-span-2 rounded-2xl border border-[#49C7B5]/25 bg-[#E7F7F1] p-5">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div><p className="text-xs font-bold uppercase tracking-wider text-[#147D79]">New client-reported check-in</p><h3 className="font-display mt-1 text-xl font-semibold text-[#123F52]">{latestShared.dayWords?.join(", ") || "Reflection completed"}</h3></div>
                      <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold text-[#147D79]">SHARED BY CLIENT</span>
                    </div>
                    <p className="mt-3 text-sm text-[#4F6E70]">Stress {latestShared.stress}/10 · Burnout {latestShared.burnout}/5 · {latestShared.drawingCompleted} drawing tasks · {latestShared.voiceCompleted} voice phrases. Raw voice and drawing content are not visible.</p>
                    {latestShared.shareReflections && latestShared.reflections?.[0] && <p className="mt-3 rounded-xl bg-white/70 p-3 text-sm italic text-[#506971]">“{latestShared.reflections[0]}”</p>}
                  </div>
                )}
                <SummaryBlock title="Improved" tone="mint" items={summary.improved} />
                <SummaryBlock title="Still challenging" tone="coral" items={summary.challenges} />
                <SummaryBlock title="Plan adherence" tone="blue" items={summary.adherence} />
                <SummaryBlock title="Client question" tone="gold" items={summary.question} />
              </div>
              <button onClick={() => setEvidenceOpen(!evidenceOpen)} className="mt-6 flex items-center gap-2 text-sm font-bold text-[#147D79]">{evidenceOpen ? "Hide" : "Expand"} evidence <ChevronDown className={`size-4 transition ${evidenceOpen ? "rotate-180" : ""}`} /></button>
              {evidenceOpen && <div className="mt-4 rounded-2xl bg-[#F4F8F6] p-4 text-xs leading-relaxed text-[#627980]">Source: {displayName}&apos;s patient-specific responses and assigned monitoring schedule. Missing responses are not treated as observed data.</div>}
            </article>
            <aside className="space-y-5">
              <div className="rounded-3xl border border-[#123F52]/10 bg-[#123F52] p-6 text-white shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8EE0D2]">Suggested discussion</p>
                <ol className="mt-5 space-y-4 text-sm">
                  {[`Review ${client.programs.join(" and ").toLowerCase()} trends.`, client.question ? "Address the patient's recorded question." : "Confirm whether a new concern has emerged.", "Check whether the current monitoring schedule remains practical."].map((item, index) => <li key={item} className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/10 text-xs">{index + 1}</span><span className="leading-relaxed text-white/76">{item}</span></li>)}
                </ol>
              </div>
              <div className="rounded-3xl border border-[#123F52]/10 bg-white p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-[#55717A]">Sharing permissions</p>
                <p className="mt-3 text-sm leading-relaxed">Selected scores, symptoms, goals and marked questions are shared. Raw voice, drawing and private reflections remain hidden.</p>
                <button className="mt-4 text-sm font-bold text-[#147D79]">View permissions</button>
              </div>
            </aside>
          </div>
        )}

        {tab === "monitoring" && <MonitoringPanel client={client} />}
        {tab === "trends" && <ClientTrends client={client} />}
        {tab === "goals & barriers" && <GoalsAndBarriers />}
        {(tab === "check-in history" || tab === "follow-ups") && <HistoryPanel followups={tab === "follow-ups"} />}
      </div>
    </div>
  );
}

function SummaryBlock({ title, items, tone }: { title: string; items: string[]; tone: "mint" | "coral" | "blue" | "gold" }) {
  const tones = { mint: "bg-[#E7F7F1] border-[#49C7B5]/20", coral: "bg-[#FFF0ED] border-[#F28F82]/20", blue: "bg-[#EAF4FC] border-[#77ACD2]/20", gold: "bg-[#FFF7E7] border-[#F4C36C]/25" };
  return <div className={`rounded-2xl border p-5 ${tones[tone]}`}><h3 className="font-display text-xl font-semibold text-[#123F52]">{title}</h3><ul className="mt-3 space-y-2">{items.map((item) => <li key={item} className="flex gap-2 text-sm leading-relaxed text-[#506971]"><Check className="mt-1 size-3.5 shrink-0 text-[#17A7A3]" />{item}</li>)}</ul></div>;
}

function ClientTrends({ client }: { client: DirectoryClient }) {
  const [range, setRange] = useState("8 weeks");
  const [metric, setMetric] = useState("sleep");
  const base = client.score / 10;
  const data = [
    { date: "Sep 21", sleep: +(base-1.3).toFixed(1), energy: +(base-1.8).toFixed(1), digestion: +(base-1.5).toFixed(1) },
    { date: "Sep 28", sleep: +(base-1).toFixed(1), energy: +(base-1.4).toFixed(1), digestion: +(base-1.2).toFixed(1) },
    { date: "Oct 5", sleep: +(base-1.2).toFixed(1), energy: +(base-1.5).toFixed(1), digestion: +(base-1.4).toFixed(1) },
    { date: "Oct 12", sleep: +(base-.7).toFixed(1), energy: +(base-1).toFixed(1), digestion: +(base-.9).toFixed(1) },
    { date: "Oct 19", sleep: +(base-.8).toFixed(1), energy: +(base-1.1).toFixed(1), digestion: +(base-1).toFixed(1) },
    { date: "Oct 26", sleep: null, energy: null, digestion: null },
    { date: "Nov 2", sleep: +(base-.3).toFixed(1), energy: +(base-.6).toFixed(1), digestion: +(base-.7).toFixed(1) },
    { date: "Nov 9", sleep: +base.toFixed(1), energy: +(base-.3).toFixed(1), digestion: +(base-.6).toFixed(1) },
  ];
  return (
    <article className="rounded-3xl border border-[#123F52]/10 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div><p className="text-xs font-bold uppercase tracking-wider text-[#17A7A3]">Self-reported measures</p><h2 className="font-display mt-1 text-2xl font-semibold text-[#123F52]">Longitudinal trends</h2></div>
        <div className="flex flex-wrap gap-2">{["2 weeks", "8 weeks", "3 months"].map((item) => <button key={item} onClick={() => setRange(item)} className={`rounded-lg px-3 py-2 text-xs font-bold ${range === item ? "bg-[#123F52] text-white" : "bg-[#F0F5F3] text-[#61777F]"}`}>{item}</button>)}</div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">{["sleep", "energy", "digestion"].map((item) => <button key={item} onClick={() => setMetric(item)} className={`rounded-full border px-3 py-1.5 text-xs font-bold capitalize ${metric === item ? "border-[#17A7A3] bg-[#E7F7F1] text-[#147D79]" : "border-[#123F52]/10 text-[#6B7F86]"}`}>{item}</button>)}</div>
      <div className="mt-6 h-[330px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 15, right: 12, left: -18, bottom: 0 }}>
            <defs key="client-detail-defs"><linearGradient id="clientDetailFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#17A7A3" stopOpacity={0.28} /><stop offset="100%" stopColor="#17A7A3" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid key="client-detail-grid" stroke="#E4ECE9" vertical={false} />
            <XAxis key="client-detail-x" dataKey="date" tick={{ fill: "#75898F", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis key="client-detail-y" domain={[0, 10]} tick={{ fill: "#75898F", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip key="client-detail-tooltip" contentStyle={{ borderRadius: 12, border: "1px solid #DDE8E4" }} />
            <Area key={`client-detail-${metric}`} id={`client-detail-${metric}`} isAnimationActive={false} connectNulls={false} type="monotone" dataKey={metric} stroke="#17A7A3" strokeWidth={3} fill="url(#clientDetailFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-4 text-xs text-[#768A90]">{client.name}&apos;s subjective self-ratings from 0–10. Missing periods indicate no recorded check-in and are not interpolated.</p>
    </article>
  );
}

function GoalsAndBarriers() {
  const [discussed, setDiscussed] = useState<string[]>([]);
  const goals = [
    ["Evening wind-down", "5/7 days", "Work schedule", "Somewhat helpful"],
    ["Regular meals", "4/7 days", "Busy afternoons", "Unsure"],
    ["Activity breaks", "6/7 days", "Low energy", "Helpful"],
  ];
  return (
    <article className="rounded-3xl border border-[#123F52]/10 bg-white p-5 shadow-sm sm:p-7">
      <p className="text-xs font-bold uppercase tracking-wider text-[#17A7A3]">Goals, adherence and barriers</p>
      <h2 className="font-display mt-1 text-3xl font-semibold text-[#123F52]">What did the client try, and what happened?</h2>
      <div className="mt-6 space-y-3">
        {goals.map(([goal, progress, barrier, benefit]) => (
          <div key={goal} className="grid gap-4 rounded-2xl border border-[#123F52]/8 bg-[#F8FAF9] p-4 md:grid-cols-[1.3fr_0.7fr_1fr_1fr_auto] md:items-center">
            <div><p className="text-sm font-bold">{goal}</p><p className="mt-1 text-xs text-[#75888E]">Client-reported</p></div>
            <div><p className="text-[10px] font-bold uppercase text-[#7A8C91]">Progress</p><p className="mt-1 text-sm">{progress}</p></div>
            <div><p className="text-[10px] font-bold uppercase text-[#7A8C91]">Barrier</p><p className="mt-1 text-sm">{barrier}</p></div>
            <div><p className="text-[10px] font-bold uppercase text-[#7A8C91]">Perceived benefit</p><p className="mt-1 text-sm">{benefit}</p></div>
            <button onClick={() => setDiscussed((current) => current.includes(goal) ? current.filter((item) => item !== goal) : [...current, goal])} className={`rounded-lg px-3 py-2 text-xs font-bold ${discussed.includes(goal) ? "bg-[#E7F7F1] text-[#147D79]" : "bg-white text-[#536C75] shadow-sm"}`}>{discussed.includes(goal) ? "Discussed" : "Mark discussed"}</button>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2"><SummaryBlock title="What helped?" tone="mint" items={["Better scheduling", "Family support", "A simpler routine"]} /><SummaryBlock title="What's getting in the way?" tone="coral" items={["Irregular work hours", "Low afternoon energy", "Busy meal periods"]} /></div>
    </article>
  );
}

function HistoryPanel({ followups }: { followups: boolean }) {
  return (
    <article className="rounded-3xl border border-[#123F52]/10 bg-white p-6 shadow-sm">
      <h2 className="font-display text-2xl font-semibold text-[#123F52]">{followups ? "Follow-up history" : "Check-in history"}</h2>
      <div className="mt-5 divide-y divide-[#123F52]/8">
        {(followups ? ["Nov 2 · Follow-up interval reviewed", "Oct 19 · Goals updated at visit", "Sep 8 · Appointment reminder approved"] : ["Nov 9 · Weekly check-in completed", "Nov 2 · Weekly check-in completed", "Oct 26 · No response", "Oct 19 · Appointment day"]).map((item) => <button key={item} className="flex w-full items-center justify-between py-4 text-left text-sm font-semibold"><span>{item}</span><ChevronRight className="size-4 text-[#8AA0A6]" /></button>)}
      </div>
    </article>
  );
}

function ProgramsWorkspace({
  practiceMode,
  setPracticeMode,
  onBack,
}: {
  practiceMode: "nd" | "therapy";
  setPracticeMode: (mode: "nd" | "therapy") => void;
  onBack: () => void;
}) {
  const [frequency, setFrequency] = useState("Weekly");
  const [voice, setVoice] = useState(true);
  const [question, setQuestion] = useState(practiceMode === "nd" ? "How would you rate your digestive comfort?" : "How manageable did stress feel this week?");
  const therapy = practiceMode === "therapy";
  return (
    <div className="min-h-screen bg-[#F4F8F6] p-4 text-[#20343C] sm:p-7 lg:p-10">
      <div className="mx-auto max-w-6xl">
        <PractitionerPageHeader title="Check-in programs" eyebrow="Practice configuration" onBack={onBack} />
        <div className="mb-6 flex w-fit rounded-xl border border-[#123F52]/10 bg-white p-1 shadow-sm"><button onClick={() => { setPracticeMode("nd"); setQuestion("How would you rate your digestive comfort?"); }} className={`rounded-lg px-4 py-2 text-sm font-bold ${!therapy ? "bg-[#123F52] text-white" : "text-[#657B82]"}`}>ND practice</button><button onClick={() => { setPracticeMode("therapy"); setQuestion("How manageable did stress feel this week?"); }} className={`rounded-lg px-4 py-2 text-sm font-bold ${therapy ? "bg-[#123F52] text-white" : "text-[#657B82]"}`}>Therapy practice</button></div>
        <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <section className="rounded-3xl border border-[#123F52]/10 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-[#17A7A3]">Selected template</p>
            <h2 className="font-display mt-2 text-3xl font-semibold text-[#123F52]">{therapy ? "Therapy Between-Session Reflection" : "ND Whole-Person Progress"}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#677D84]">A configurable tracking template—not a diagnostic or treatment protocol.</p>
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-bold">Frequency<select value={frequency} onChange={(event) => setFrequency(event.target.value)} className="mt-2 w-full rounded-xl border border-[#123F52]/12 bg-[#F8FAF9] p-3 font-normal outline-none"><option>Weekly</option><option>Twice weekly</option><option>Every two weeks</option></select></label>
              <label className="text-sm font-bold">Expressive reflection<button onClick={() => setVoice(!voice)} className={`mt-2 flex w-full items-center justify-between rounded-xl border p-3 text-left font-normal ${voice ? "border-[#17A7A3] bg-[#E7F7F1]" : "border-[#123F52]/12 bg-[#F8FAF9]"}`}><span>Voice, text or drawing</span><span className={`h-6 w-10 rounded-full p-1 ${voice ? "bg-[#17A7A3]" : "bg-[#C8D3D0]"}`}><i className={`block size-4 rounded-full bg-white transition ${voice ? "translate-x-4" : ""}`} /></span></button></label>
            </div>
            <label className="mt-6 block text-sm font-bold">Example custom question<input value={question} onChange={(event) => setQuestion(event.target.value)} className="mt-2 w-full rounded-xl border border-[#123F52]/12 bg-[#F8FAF9] p-3 font-normal outline-none focus:ring-2 focus:ring-[#17A7A3]/25" /></label>
            <div className="mt-6"><p className="text-xs font-bold uppercase tracking-wider text-[#667D84]">Tracked areas</p><div className="mt-3 flex flex-wrap gap-2">{(therapy ? ["Mood", "Stress", "Sleep", "Coping practice", "Client goals", "Questions"] : ["Sleep", "Energy", "Stress", "Mood", "Digestion", "Lifestyle goals", "Questions"]).map((item) => <button key={item} className="rounded-full border border-[#17A7A3]/20 bg-[#E7F7F1] px-3 py-2 text-xs font-bold text-[#147D79]">{item} ×</button>)}</div></div>
          </section>
          <aside className="rounded-3xl bg-[#123F52] p-6 text-white shadow-xl">
            <p className="text-xs font-bold uppercase tracking-wider text-[#8EE0D2]">Live client preview</p>
            <div className="mt-6 rounded-[26px] bg-[#F8FAF9] p-5 text-[#20343C]">
              <div className="flex items-center justify-between text-[10px] font-bold text-[#70858B]"><span>WEEKLY PULSEKEY™</span><span>2 OF 5</span></div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#DCE7E3]"><div className="h-full w-2/5 rounded-full bg-[#17A7A3]" /></div>
              <h3 className="font-display mt-7 text-2xl font-semibold text-[#123F52]">{question}</h3>
              <div className="mt-7 flex justify-between">{[1, 2, 3, 4, 5].map((value) => <button key={value} className={`grid size-10 place-items-center rounded-full text-sm font-bold ${value === 4 ? "bg-[#17A7A3] text-white" : "bg-[#EAF4FC] text-[#496773]"}`}>{value}</button>)}</div>
              <button className="mt-8 w-full rounded-xl bg-[#123F52] py-3 text-sm font-bold text-white">Continue</button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function FollowUpWorkspace({ onBack }: { onBack: () => void }) {
  const [status, setStatus] = useState<"review" | "preview" | "sent">("review");
  return (
    <div className="min-h-screen bg-[#F4F8F6] p-4 text-[#20343C] sm:p-7 lg:p-10">
      <div className="mx-auto max-w-5xl">
        <PractitionerPageHeader title="Omar Lee · Follow-up" eyebrow="Practitioner-controlled workflow" onBack={onBack} />
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <article className="rounded-3xl border border-[#123F52]/10 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-4"><div className="grid size-14 place-items-center rounded-full bg-[#EAF4FC] font-bold text-[#315C73]">OL</div><div><h2 className="font-display text-2xl font-semibold text-[#123F52]">Omar Lee</h2><p className="mt-1 text-sm text-[#6D8187]">Last visit 7 weeks ago · No appointment booked</p></div></div>
            <div className="mt-7 grid gap-4 sm:grid-cols-3">{[["Planned follow-up", "6 weeks"], ["Last check-in", "17 days ago"], ["Check-in gap", "2 missed"]].map(([label, value]) => <div key={label} className="rounded-2xl bg-[#F4F8F6] p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-[#75898F]">{label}</p><p className="mt-2 font-display text-xl font-semibold text-[#123F52]">{value}</p></div>)}</div>
            <div className="mt-6 rounded-2xl border border-[#F4C36C]/30 bg-[#FFF7E7] p-5"><p className="font-bold text-[#79581F]">Omar is past the follow-up interval set at the last appointment.</p><p className="mt-2 text-sm leading-relaxed text-[#796B51]">Review context before choosing whether to prepare a reminder. Nothing is sent automatically.</p></div>
          </article>
          <aside className="rounded-3xl border border-[#123F52]/10 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-[#17A7A3]">Simulated reminder</p>
            {status === "review" && <><h3 className="font-display mt-3 text-2xl font-semibold text-[#123F52]">Prepare a follow-up note?</h3><p className="mt-3 text-sm leading-relaxed text-[#697E85]">You can preview and edit the message before approving it.</p><button onClick={() => setStatus("preview")} className="mt-6 w-full rounded-xl bg-[#123F52] py-3 text-sm font-bold text-white">Prepare reminder</button></>}
            {status === "preview" && <><textarea defaultValue="Hi Omar, it's been a little while since your last visit. If you'd like to review your progress and next steps, you can request a follow-up appointment." className="mt-4 min-h-[170px] w-full rounded-xl border border-[#123F52]/12 bg-[#F8FAF9] p-4 text-sm leading-relaxed outline-none" /><button onClick={() => setStatus("sent")} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#17A7A3] py-3 text-sm font-bold text-white"><Send className="size-4" /> Approve & send simulation</button></>}
            {status === "sent" && <div className="py-8 text-center"><div className="mx-auto grid size-14 place-items-center rounded-full bg-[#E7F7F1] text-[#147D79]"><CheckCircle2 className="size-6" /></div><h3 className="font-display mt-4 text-2xl font-semibold text-[#123F52]">Reminder approved</h3><p className="mt-2 text-sm text-[#6F8288]">Simulated as sent. Follow-up history has been updated.</p></div>}
            <p className="mt-5 text-[11px] leading-relaxed text-[#87979B]">Prototype only. No message or appointment integration is active.</p>
          </aside>
        </div>
      </div>
    </div>
  );
}
