import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { createBrowserRouter, RouterProvider, useLocation, useNavigate } from "react-router";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  Check,
  ChevronRight,
  CircleStop,
  Clock3,
  Eraser,
  LockKeyhole,
  Mic,
  Paintbrush,
  Pause,
  Play,
  Send,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Type,
  UserRound,
  Volume2,
  Wind,
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
import { TherapistDashboard } from "./components/TherapistDashboard";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";
import { AuthenticPulseKeyFlow, type PulseKeyResult } from "./components/AuthenticPulseKeyFlow";
import { NDHub, PatientCare } from "./components/NDMAPSExtension";
import { ManufacturerDashboard } from "./components/ManufacturerDashboard";
import { PatientCareCheckIn, PatientCareCheckInCard, PersonalizedCareWorkspace } from "./components/PatientMonitoring";
import { NDMAPSProvider, useNDMAPS } from "./data/NDMAPSData";
import officialLogo from "../imports/2.png";

type AppView = "home" | "checkin" | "care-checkin" | "processing" | "patient-dashboard" | "breathing" | "care";

const patientProgress = [
  { week: "May 6", wellbeing: 48, energy: 42 },
  { week: "May 13", wellbeing: 55, energy: 48 },
  { week: "May 20", wellbeing: 52, energy: 46 },
  { week: "May 27", wellbeing: 61, energy: 58 },
  { week: "Jun 3", wellbeing: 67, energy: 62 },
  { week: "Jun 10", wellbeing: 72, energy: 68 },
];

const formatTime = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

function Brand() {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 shadow-sm">
      <ImageWithFallback src={officialLogo} alt="mentAImage official logo" className="h-7 w-auto object-contain sm:h-8" />
      <div className="hidden border-l border-[#123F52]/15 pl-3 sm:block">
        <p className="text-sm font-bold leading-none text-[#123F52]">PulseKey™</p>
        <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.2em] text-[#4B737F]">Between-visit insights</p>
      </div>
    </div>
  );
}

function AppShell({
  children,
  onHome,
  onLanding,
  onTherapist,
  compact = false,
}: {
  children: React.ReactNode;
  onHome: () => void;
  onLanding?: () => void;
  onTherapist: () => void;
  compact?: boolean;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0E4562] text-white">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_82%_7%,rgba(96,225,207,0.4),transparent_28%),radial-gradient(circle_at_10%_90%,rgba(16,98,124,0.6),transparent_34%),linear-gradient(145deg,#0A3B56_0%,#0F6071_55%,#28AAA4_100%)]" />
      <div className="fixed -right-20 top-[30%] size-72 rounded-full border border-white/10" />
      <div className="fixed -right-10 top-[34%] size-56 rounded-full border border-white/10" />
      <div className="relative mx-auto max-w-[1440px] px-4 sm:px-7 lg:px-10">
        <header className={`flex items-center justify-between ${compact ? "py-5" : "py-6 lg:py-8"}`}>
          <button onClick={onLanding ?? onHome} title="Return to demo home" className="rounded-xl text-left focus:outline-none focus:ring-2 focus:ring-[#D9F06F]">
            <Brand />
          </button>
          <button
            onClick={onTherapist}
            className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2.5 text-xs font-bold text-white/85 backdrop-blur-xl transition hover:bg-white/18 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#D9F06F] sm:px-4 sm:text-sm"
          >
            <Stethoscope className="size-4" />
            <span className="hidden sm:inline">Therapist portal</span>
            <span className="sm:hidden">Therapist</span>
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}

function PatientHome({
  onStart,
  onDashboard,
  onTherapist,
  onLanding,
}: {
  onStart: () => void;
  onDashboard: () => void;
  onTherapist: () => void;
  onLanding?: () => void;
}) {
  return (
    <AppShell onHome={() => undefined} onLanding={onLanding} onTherapist={onTherapist}>
      <main className="grid min-h-[calc(100vh-104px)] items-center gap-8 pb-10">
        <section className="max-w-2xl py-4 lg:py-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#D9F06F]/30 bg-[#D9F06F]/12 px-3 py-1.5 text-xs font-bold text-[#E8F79D]">
            <span className="size-1.5 rounded-full bg-[#D9F06F]" />
            WEEK 6 · CHECK-IN READY
          </div>
          <h1 className="font-display max-w-xl text-5xl font-semibold leading-[0.96] tracking-[-0.035em] sm:text-6xl lg:text-7xl">
            How has this week <span className="text-[#D9F06F]">felt?</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/68 sm:text-lg">
            There is no right way to check in. Write it, say it, or draw it—PulseKey helps you notice patterns and bring what matters into therapy.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={onStart}
              className="group flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-[#F6F8EE] px-6 font-bold text-[#103F52] shadow-xl shadow-[#062D3D]/25 transition hover:-translate-y-0.5 hover:bg-white focus:outline-none focus:ring-4 focus:ring-white/30"
            >
              Begin weekly check-in
              <ArrowRight className="size-5 transition group-hover:translate-x-1" />
            </button>
            <button
              onClick={onDashboard}
              className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-white/16 bg-white/10 px-6 font-semibold text-white backdrop-blur-xl transition hover:bg-white/16 focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              View my progress
            </button>
          </div>
          <div className="mt-7 flex items-center gap-2 text-xs text-white/48">
            <ShieldCheck className="size-4 text-[#A9E7E2]" />
            You control what is shared with your therapist.
          </div>
        </section>

        <section className="relative mx-auto w-full max-w-xl lg:max-w-none">
          <div className="absolute -inset-5 rounded-[40px] bg-white/5 blur-xl" />
          <div className="relative overflow-hidden rounded-[30px] border border-white/18 bg-white/11 p-5 shadow-2xl shadow-[#052D3B]/30 backdrop-blur-2xl sm:p-7">
            <div className="mb-7 flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D9F06F]">This week</p>
                <h2 className="font-display mt-1 text-2xl font-semibold sm:text-3xl">Three ways to express it</h2>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/60">~4 min</span>
            </div>
            <div className="space-y-3">
              {[
                { icon: Type, number: "01", title: "Put it into words", copy: "A short reflection about your week", color: "#D9F06F" },
                { icon: Mic, number: "02", title: "Say what is present", copy: "A private voice reflection", color: "#A9E7E2" },
                { icon: Paintbrush, number: "03", title: "Draw the feeling", copy: "Shapes and color—no art skills needed", color: "#FFD19D" },
              ].map((item) => (
                <div key={item.title} className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-2xl border border-white/10 bg-[#073E52]/30 p-4 transition hover:bg-white/10 sm:p-5">
                  <div className="grid size-11 place-items-center rounded-2xl text-[#123F4D]" style={{ backgroundColor: item.color }}>
                    <item.icon className="size-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-1 text-xs text-white/48">{item.copy}</p>
                  </div>
                  <span className="font-display text-xl text-white/20">{item.number}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/10 pt-5 text-center">
              <div><p className="font-display text-2xl font-semibold">6</p><p className="text-[10px] uppercase tracking-wider text-white/40">Weeks in</p></div>
              <div><p className="font-display text-2xl font-semibold text-[#D9F06F]">+14%</p><p className="text-[10px] uppercase tracking-wider text-white/40">Wellbeing</p></div>
              <div><p className="font-display text-2xl font-semibold">5</p><p className="text-[10px] uppercase tracking-wider text-white/40">Check-ins</p></div>
            </div>
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function DrawPad({ paths, setPaths }: { paths: string[]; setPaths: (paths: string[]) => void }) {
  const [activePath, setActivePath] = useState("");
  const drawing = useRef(false);

  const point = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 620;
    const y = ((event.clientY - rect.top) / rect.height) * 270;
    return `${Math.round(x)},${Math.round(y)}`;
  };

  const start = (event: React.PointerEvent<SVGSVGElement>) => {
    drawing.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    setActivePath(`M ${point(event)}`);
  };

  const move = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!drawing.current) return;
    setActivePath((current) => `${current} L ${point(event)}`);
  };

  const end = () => {
    if (activePath) setPaths([...paths, activePath]);
    drawing.current = false;
    setActivePath("");
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[#0E4562]/10 bg-[#F8F5E9]">
      <div className="flex items-center justify-between border-b border-[#0E4562]/10 px-4 py-3 text-[#123F4D]">
        <div className="flex items-center gap-2 text-xs font-bold"><span className="size-3 rounded-full bg-[#168C88]" /> Teal ink</div>
        <button onClick={() => setPaths([])} className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-[#54717A] hover:bg-[#0E4562]/5">
          <Eraser className="size-3.5" /> Clear
        </button>
      </div>
      <svg
        viewBox="0 0 620 270"
        className="h-[270px] w-full touch-none cursor-crosshair bg-[radial-gradient(circle,#CBD5C8_1px,transparent_1px)] [background-size:18px_18px]"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        aria-label="Drawing canvas"
      >
        {paths.map((path, index) => <path key={index} d={path} fill="none" stroke="#168C88" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />)}
        {activePath && <path d={activePath} fill="none" stroke="#168C88" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />}
        {!paths.length && !activePath && (
          <text x="310" y="138" textAnchor="middle" fill="#7C948F" fontSize="14">Draw the shape of your week here</text>
        )}
      </svg>
    </div>
  );
}

function CheckInFlow({
  onExit,
  onComplete,
  onTherapist,
}: {
  onExit: () => void;
  onComplete: () => void;
  onTherapist: () => void;
}) {
  const [step, setStep] = useState(0);
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [paths, setPaths] = useState<string[]>([]);
  const [share, setShare] = useState(true);

  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [recording]);

  const stopRecording = () => {
    setRecording(false);
    setRecorded(true);
    if (seconds < 8) setSeconds(18);
  };

  const canContinue =
    (step === 0 && text.trim().length >= 20) ||
    (step === 1 && recorded) ||
    (step === 2 && paths.length > 0) ||
    step === 3;

  const screens = [
    {
      eyebrow: "01 · TEXT",
      title: "What stayed with you this week?",
      copy: "Write whatever feels most important. A few honest sentences are enough.",
    },
    {
      eyebrow: "02 · VOICE",
      title: "Say what was hard to put into words.",
      copy: "Speak naturally. Your recording becomes a private reflection and is never used without your consent.",
    },
    {
      eyebrow: "03 · DRAW",
      title: "If your week had a shape, what would it be?",
      copy: "Use lines, loops, pressure, or space. There is nothing to get right.",
    },
    {
      eyebrow: "04 · REVIEW",
      title: "Your check-in is ready.",
      copy: "You expressed your week in three different ways. Choose whether to share this check-in with your therapist.",
    },
  ];

  return (
    <AppShell onHome={onExit} onTherapist={onTherapist} compact>
      <main className="mx-auto max-w-4xl pb-10 pt-2 sm:pt-5">
        <div className="mb-5 flex items-center justify-between">
          <button onClick={step === 0 ? onExit : () => setStep(step - 1)} className="flex items-center gap-2 text-sm font-semibold text-white/60 transition hover:text-white">
            <ArrowLeft className="size-4" /> Back
          </button>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/45">Weekly check-in · {step + 1} of 4</p>
        </div>
        <div className="mb-6 grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className={`h-1.5 rounded-full transition-all duration-500 ${item <= step ? "bg-[#D9F06F]" : "bg-white/15"}`} />
          ))}
        </div>

        <motion.section
          key={step}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[30px] border border-white/18 bg-white/12 p-5 shadow-2xl shadow-[#052D3B]/25 backdrop-blur-2xl sm:p-8 lg:p-10"
        >
          <p className="text-xs font-bold tracking-[0.18em] text-[#D9F06F]">{screens[step].eyebrow}</p>
          <h1 className="font-display mt-3 max-w-2xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{screens[step].title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/58 sm:text-base">{screens[step].copy}</p>

          <div className="mt-7">
            {step === 0 && (
              <div>
                <textarea
                  value={text}
                  onChange={(event) => setText(event.target.value.slice(0, 400))}
                  placeholder="This week I noticed..."
                  className="min-h-[230px] w-full resize-none rounded-2xl border border-white/20 bg-[#F8FAF2] p-5 text-base leading-relaxed text-[#143E4C] outline-none placeholder:text-[#7C9295] focus:ring-4 focus:ring-[#D9F06F]/25 sm:text-lg"
                  autoFocus
                />
                <div className="mt-2 flex justify-between text-xs text-white/48">
                  <span>{text.length < 20 ? `${20 - text.length} more characters to continue` : "That is enough—add more only if it helps."}</span>
                  <span>{text.length}/400</span>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="rounded-3xl border border-white/12 bg-[#073E52]/35 px-5 py-9 text-center sm:px-8 sm:py-12">
                <div className="mx-auto flex h-20 max-w-md items-center justify-center gap-1">
                  {Array.from({ length: 30 }).map((_, index) => (
                    <motion.span
                      key={index}
                      animate={recording ? { height: [8, 16 + ((index * 13) % 42), 10] } : { height: recorded ? 10 + ((index * 7) % 28) : 4 }}
                      transition={{ repeat: recording ? Infinity : 0, duration: 0.8, delay: index * 0.025 }}
                      className={`w-1 rounded-full ${recording ? "bg-[#D9F06F]" : recorded ? "bg-[#A9E7E2]" : "bg-white/20"}`}
                    />
                  ))}
                </div>
                <p className="mt-4 font-display text-3xl font-semibold tabular-nums">{formatTime(seconds)}</p>
                <p className="mt-1 text-xs text-white/45">{recording ? "Listening privately…" : recorded ? "Reflection captured" : "Tap when you are ready"}</p>
                <div className="mt-7 flex justify-center">
                  {!recording && !recorded && (
                    <button onClick={() => setRecording(true)} className="grid size-16 place-items-center rounded-full bg-[#D9F06F] text-[#103F52] shadow-xl shadow-black/20 transition hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#D9F06F]/30">
                      <Mic className="size-6" />
                    </button>
                  )}
                  {recording && (
                    <button onClick={stopRecording} className="grid size-16 place-items-center rounded-full bg-[#FFB5A5] text-[#5F2922] shadow-xl shadow-black/20 transition hover:scale-105">
                      <CircleStop className="size-6" />
                    </button>
                  )}
                  {recorded && (
                    <div className="flex items-center gap-3">
                      <button className="grid size-12 place-items-center rounded-full bg-white text-[#103F52]"><Play className="ml-0.5 size-5" /></button>
                      <button onClick={() => { setRecorded(false); setSeconds(0); }} className="rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-white/70 hover:bg-white/10">Record again</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 2 && <DrawPad paths={paths} setPaths={setPaths} />}

            {step === 3 && (
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { icon: Type, label: "Written reflection", value: `${text.length} characters`, color: "#D9F06F" },
                  { icon: Volume2, label: "Voice reflection", value: formatTime(seconds), color: "#A9E7E2" },
                  { icon: Paintbrush, label: "Feeling drawing", value: `${paths.length} strokes`, color: "#FFD19D" },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-white/8 p-4">
                    <div className="mb-6 grid size-10 place-items-center rounded-xl text-[#123F4D]" style={{ backgroundColor: item.color }}><item.icon className="size-4" /></div>
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="mt-1 text-xs text-white/45">{item.value}</p>
                  </div>
                ))}
                <button
                  onClick={() => setShare(!share)}
                  className="col-span-full mt-2 flex items-start gap-4 rounded-2xl border border-white/12 bg-[#062F43]/40 p-4 text-left transition hover:bg-white/8"
                >
                  <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border ${share ? "border-[#D9F06F] bg-[#D9F06F] text-[#103F52]" : "border-white/30"}`}>
                    {share && <Check className="size-3.5" />}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">Share this check-in with Dr. Morgan</span>
                    <span className="mt-1 block text-xs leading-relaxed text-white/48">Your therapist will see your trends and reflections before your next session. You can withdraw access later.</span>
                  </span>
                </button>
              </div>
            )}
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-6">
            <p className="hidden items-center gap-2 text-xs text-white/40 sm:flex"><LockKeyhole className="size-3.5" /> Private by default</p>
            <button
              disabled={!canContinue}
              onClick={() => step < 3 ? setStep(step + 1) : onComplete()}
              className="ml-auto flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#F6F8EE] px-6 font-bold text-[#103F52] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-35 focus:outline-none focus:ring-4 focus:ring-white/20"
            >
              {step === 3 ? <><Send className="size-4" /> Complete check-in</> : <>Continue <ArrowRight className="size-4" /></>}
            </button>
          </div>
        </motion.section>
      </main>
    </AppShell>
  );
}

function CompleteCheckInFlow({
  onExit,
  onComplete,
  onTherapist,
}: {
  onExit: () => void;
  onComplete: () => void;
  onTherapist: () => void;
}) {
  const [step, setStep] = useState(0);
  const [feelings, setFeelings] = useState<string[]>([]);
  const [words, setWords] = useState<string[]>([]);
  const [customWord, setCustomWord] = useState("");
  const [ratings, setRatings] = useState({ Energy: 6, Stress: 5, Sleep: 6, Digestion: 6 });
  const [mode, setMode] = useState<"voice" | "text" | "drawing">("text");
  const [reflection, setReflection] = useState("");
  const [recording, setRecording] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [paths, setPaths] = useState<string[]>([]);
  const [adherence, setAdherence] = useState("Tried sometimes");
  const [days, setDays] = useState(4);
  const [barriers, setBarriers] = useState<string[]>(["Time constraints"]);
  const [question, setQuestion] = useState("");
  const [contact, setContact] = useState(false);
  const [share, setShare] = useState(true);

  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [recording]);

  const emotionOptions = [
    ["Calm", "◡"], ["Hopeful", "✦"], ["Energized", "↗"], ["Tired", "◔"],
    ["Overwhelmed", "≈"], ["Anxious", "∿"], ["Frustrated", "×"], ["Mixed feelings", "◐"],
  ];
  const wordOptions = ["steady", "restless", "connected", "drained", "curious", "stretched", "proud", "uncertain"];
  const steps = ["Feelings", "Ratings", "Express", "My plan", "Question", "Review"];
  const toggleMaxTwo = (value: string, current: string[], setter: (values: string[]) => void) => {
    if (current.includes(value)) setter(current.filter((item) => item !== value));
    else if (current.length < 2) setter([...current, value]);
  };
  const toggleBarrier = (value: string) => setBarriers((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  const canContinue = step !== 0 || (feelings.length > 0 && (words.length >= 2 || (words.length === 1 && customWord.trim())));

  return (
    <AppShell onHome={onExit} onTherapist={onTherapist} compact>
      <main className="mx-auto max-w-4xl pb-28 pt-2">
        <div className="mb-5 flex items-center justify-between">
          <button onClick={step === 0 ? onExit : () => setStep(step - 1)} className="flex items-center gap-2 text-sm font-semibold text-white/65 hover:text-white"><ArrowLeft className="size-4" /> Back</button>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/45">About 3 minutes · {step + 1} of 6</p>
        </div>
        <div className="mb-6 flex gap-2">
          {steps.map((label, index) => <div key={label} className="flex-1"><div className={`h-1.5 rounded-full ${index <= step ? "bg-[#D9F06F]" : "bg-white/15"}`} /><span className="mt-2 hidden text-center text-[9px] font-bold uppercase tracking-wider text-white/35 sm:block">{label}</span></div>)}
        </div>

        <motion.section key={step} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[30px] border border-white/18 bg-white/12 p-5 shadow-2xl shadow-[#052D3B]/25 backdrop-blur-2xl sm:p-8">
          {step === 0 && (
            <>
              <p className="text-xs font-bold uppercase tracking-[0.17em] text-[#D9F06F]">01 · How have you been feeling?</p>
              <h1 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">How has your week been?</h1>
              <p className="mt-2 text-sm text-white/55">Choose up to two. There are no wrong answers.</p>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {emotionOptions.map(([label, symbol]) => <button key={label} onClick={() => toggleMaxTwo(label, feelings, setFeelings)} className={`rounded-2xl border p-4 text-left transition ${feelings.includes(label) ? "border-[#D9F06F] bg-[#D9F06F]/16" : "border-white/12 bg-white/7 hover:bg-white/12"}`}><span className="font-display text-2xl text-[#D9F06F]">{symbol}</span><span className="mt-4 block text-sm font-bold">{label}</span></button>)}
              </div>
              <div className="mt-7 border-t border-white/10 pt-6"><p className="text-sm font-bold">Choose two words that describe your week.</p><div className="mt-3 flex flex-wrap gap-2">{wordOptions.map((word) => <button key={word} onClick={() => toggleMaxTwo(word, words, setWords)} className={`rounded-full border px-3.5 py-2 text-sm ${words.includes(word) ? "border-[#A9E7E2] bg-[#A9E7E2] text-[#123F52]" : "border-white/15 text-white/65 hover:bg-white/10"}`}>{word}</button>)}</div><input value={customWord} onChange={(event) => setCustomWord(event.target.value)} placeholder="Or add your own word" className="mt-3 w-full rounded-xl border border-white/12 bg-black/10 p-3 text-sm text-white outline-none placeholder:text-white/35 focus:ring-2 focus:ring-[#D9F06F]/40" /></div>
            </>
          )}

          {step === 1 && (
            <>
              <p className="text-xs font-bold uppercase tracking-[0.17em] text-[#D9F06F]">02 · A quick snapshot</p>
              <h1 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">How are these areas feeling?</h1>
              <p className="mt-2 text-sm text-white/55">These are subjective self-ratings, not clinical measurements.</p>
              <div className="mt-7 space-y-4">
                {Object.entries(ratings).map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-white/7 p-4 sm:p-5">
                    <div className="flex items-center justify-between"><label className="text-sm font-bold">{label}{label === "Stress" ? " / tension" : label === "Digestion" ? " comfort" : label === "Sleep" ? " quality" : ""}</label><span className="font-display text-2xl font-semibold text-[#D9F06F]">{value}<small className="text-sm text-white/40">/10</small></span></div>
                    <input aria-label={label} type="range" min="0" max="10" value={value} onChange={(event) => setRatings({ ...ratings, [label]: Number(event.target.value) })} className="mt-4 w-full accent-[#D9F06F]" />
                    <div className="mt-1 flex justify-between text-[10px] text-white/35"><span>{label === "Stress" ? "Low tension" : "Low"}</span><span>{label === "Stress" ? "High tension" : "High"}</span></div>
                  </div>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-xs font-bold uppercase tracking-[0.17em] text-[#D9F06F]">03 · Express yourself</p>
              <h1 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">Sometimes it&apos;s easier to show how you feel.</h1>
              <p className="mt-2 text-sm text-white/55">Choose one optional mode. PulseKey does not use expression to diagnose you.</p>
              <div className="mt-5 grid grid-cols-3 gap-2">{(["text", "voice", "drawing"] as const).map((item) => { const Icon = item === "text" ? Type : item === "voice" ? Mic : Paintbrush; return <button key={item} onClick={() => setMode(item)} className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-bold capitalize ${mode === item ? "border-[#D9F06F] bg-[#D9F06F]/14" : "border-white/12 bg-white/6"}`}><Icon className="size-4" />{item}</button>; })}</div>
              <div className="mt-5">
                {mode === "text" && <textarea value={reflection} onChange={(event) => setReflection(event.target.value.slice(0, 500))} placeholder="What's been affecting you most this week? What went well?" className="min-h-[220px] w-full rounded-2xl bg-[#F8FAF9] p-5 text-[#20343C] outline-none placeholder:text-[#839398] focus:ring-4 focus:ring-[#D9F06F]/25" />}
                {mode === "drawing" && <DrawPad paths={paths} setPaths={setPaths} />}
                {mode === "voice" && <div className="rounded-2xl border border-white/10 bg-[#073E52]/35 p-7 text-center"><div className="mx-auto flex h-16 max-w-sm items-center justify-center gap-1">{Array.from({ length: 24 }).map((_, index) => <motion.i key={`wave-${index}`} animate={recording ? { height: [6, 12 + (index * 9) % 34, 8] } : { height: recorded ? 9 + (index * 5) % 22 : 4 }} transition={{ repeat: recording ? Infinity : 0, duration: 0.7, delay: index * 0.03 }} className={`w-1 rounded-full ${recording ? "bg-[#D9F06F]" : "bg-[#A9E7E2]/70"}`} />)}</div><p className="mt-3 font-display text-2xl font-semibold">{formatTime(seconds)}</p><button onClick={() => { if (recording) { setRecording(false); setRecorded(true); if (seconds < 5) setSeconds(22); } else { setRecording(true); setRecorded(false); } }} className={`mt-5 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold ${recording ? "bg-[#FFB5A5] text-[#63342D]" : "bg-[#D9F06F] text-[#123F52]"}`}>{recording ? <><CircleStop className="size-4" /> Finish recording</> : recorded ? <><Play className="size-4" /> Record again</> : <><Mic className="size-4" /> Start reflection</>}</button></div>}
              </div>
              <button onClick={() => setStep(3)} className="mt-4 text-xs font-bold text-white/45 hover:text-white">Skip for now</button>
            </>
          )}

          {step === 3 && (
            <>
              <p className="text-xs font-bold uppercase tracking-[0.17em] text-[#D9F06F]">04 · Progress on your plan</p>
              <h1 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">How did things go with your evening wind-down?</h1>
              <p className="mt-2 text-sm text-white/55">This is about understanding what helped—not judging missed goals.</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-4">{["Tried regularly", "Tried sometimes", "Not yet", "Not applicable"].map((item) => <button key={item} onClick={() => setAdherence(item)} className={`rounded-xl border p-4 text-sm font-bold ${adherence === item ? "border-[#D9F06F] bg-[#D9F06F]/15" : "border-white/12 bg-white/7"}`}>{item}</button>)}</div>
              <p className="mt-7 text-sm font-bold">How many days this week?</p><div className="mt-3 flex flex-wrap gap-2">{Array.from({ length: 8 }).map((_, value) => <button key={value} onClick={() => setDays(value)} className={`grid size-10 place-items-center rounded-full text-sm font-bold ${days === value ? "bg-[#A9E7E2] text-[#123F52]" : "border border-white/15 bg-white/7"}`}>{value}</button>)}</div>
              <p className="mt-7 text-sm font-bold">What made this easier or harder?</p><div className="mt-3 flex flex-wrap gap-2">{["Time constraints", "Forgot", "Cost / access", "Low energy", "Helped by a routine", "Support from others"].map((item) => <button key={item} onClick={() => toggleBarrier(item)} className={`rounded-full border px-3 py-2 text-xs font-semibold ${barriers.includes(item) ? "border-[#A9E7E2] bg-[#A9E7E2] text-[#123F52]" : "border-white/15 text-white/65"}`}>{item}</button>)}</div>
            </>
          )}

          {step === 4 && (
            <>
              <p className="text-xs font-bold uppercase tracking-[0.17em] text-[#D9F06F]">05 · For your next visit</p>
              <h1 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">Is there anything you&apos;d like to discuss?</h1>
              <p className="mt-2 text-sm text-white/55">Optional. You decide whether this is shared with Dr. Avery Morgan.</p>
              <textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="For example: I've been tired in the afternoon. Should we review my sleep plan?" className="mt-6 min-h-[190px] w-full rounded-2xl bg-[#F8FAF9] p-5 text-[#20343C] outline-none placeholder:text-[#839398] focus:ring-4 focus:ring-[#D9F06F]/25" />
              <button onClick={() => setContact(!contact)} className="mt-4 flex w-full items-start gap-3 rounded-2xl border border-white/12 bg-white/7 p-4 text-left"><span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border ${contact ? "border-[#D9F06F] bg-[#D9F06F] text-[#123F52]" : "border-white/30"}`}>{contact && <Check className="size-3.5" />}</span><span><span className="block text-sm font-bold">I would like my practitioner to contact me about this</span><span className="mt-1 block text-xs leading-relaxed text-white/45">Reviewed according to the practice&apos;s normal policy. This is not an emergency channel.</span></span></button>
            </>
          )}

          {step === 5 && (
            <>
              <p className="text-xs font-bold uppercase tracking-[0.17em] text-[#D9F06F]">06 · Review and privacy</p>
              <h1 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">Your check-in is ready.</h1>
              <p className="mt-2 text-sm text-white/55">Review what will be included before you complete it.</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <ReviewItem label="This week felt" value={[...feelings, ...words, customWord].filter(Boolean).join(", ")} />
                <ReviewItem label="Self-ratings" value={`Energy ${ratings.Energy} · Stress ${ratings.Stress} · Sleep ${ratings.Sleep} · Digestion ${ratings.Digestion}`} />
                <ReviewItem label="Evening routine" value={`${adherence} · ${days} days · ${barriers.join(", ")}`} />
                <ReviewItem label="Question" value={question || "No question added"} />
              </div>
              <button onClick={() => setShare(!share)} className="mt-5 flex w-full items-start gap-3 rounded-2xl border border-white/12 bg-[#062F43]/40 p-4 text-left"><span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border ${share ? "border-[#D9F06F] bg-[#D9F06F] text-[#123F52]" : "border-white/30"}`}>{share && <Check className="size-3.5" />}</span><span><span className="block text-sm font-bold">Share selected scores, goal progress and my marked question</span><span className="mt-1 block text-xs leading-relaxed text-white/45">Your raw voice, drawing and private reflection remain private. You can revoke sharing later.</span></span></button>
            </>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-6">
            <p className="hidden items-center gap-2 text-xs text-white/40 sm:flex"><LockKeyhole className="size-3.5" /> You remain in control</p>
            <button disabled={!canContinue} onClick={() => step < 5 ? setStep(step + 1) : onComplete()} className="ml-auto flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#F6F8EE] px-6 font-bold text-[#103F52] transition hover:bg-white disabled:opacity-35">{step === 5 ? <><Send className="size-4" /> Complete check-in</> : <>Continue <ArrowRight className="size-4" /></>}</button>
          </div>
        </motion.section>
      </main>
    </AppShell>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/7 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-[#A9E7E2]">{label}</p><p className="mt-2 text-sm leading-relaxed text-white/78">{value}</p></div>;
}

function Processing({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, 1800);
    return () => window.clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="grid min-h-screen place-items-center bg-[linear-gradient(145deg,#0A3B56,#24A49F)] p-5 text-white">
      <div className="max-w-lg text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2.4, ease: "linear" }}
          className="mx-auto grid size-20 place-items-center rounded-full border border-white/20 bg-white/10 backdrop-blur-xl"
        >
          <Sparkles className="size-7 text-[#D9F06F]" />
        </motion.div>
        <h1 className="font-display mt-7 text-3xl font-semibold sm:text-4xl">Finding the patterns in your week</h1>
        <p className="mt-3 text-white/60">Your reflections are being added to your personal progress story.</p>
      </div>
    </div>
  );
}

function PatientDashboard({
  onHome,
  onLanding,
  onStart,
  onBreathing,
  onTherapist,
  onCare,
  onCareCheckin,
  patientCaseId,
  patientName,
  latestResult,
}: {
  onHome: () => void;
  onLanding?: () => void;
  onStart: () => void;
  onBreathing: () => void;
  onTherapist: () => void;
  onCare: () => void;
  onCareCheckin: () => void;
  patientCaseId: string;
  patientName: string;
  latestResult: PulseKeyResult | null;
}) {
  const [appointmentSet, setAppointmentSet] = useState(false);
  const sharedData = useNDMAPS();
  const liveProgress = [...patientProgress, ...sharedData.microCheckins.filter((item) => item.caseId === patientCaseId).slice(0,3).reverse().map((item) => ({ week: item.date.slice(5), wellbeing: item.sleepQuality0to10 * 10, energy: Math.max(0, 100 - item.anxietySeverity0to10 * 10) }))];

  return (
    <AppShell onHome={onHome} onLanding={onLanding} onTherapist={onTherapist}>
      <main className="pb-12 pt-3">
        {latestResult && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-5 flex flex-col justify-between gap-4 rounded-2xl border border-[#D9F06F]/30 bg-[#D9F06F]/14 p-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#D9F06F] text-[#103F52]"><Check className="size-5" /></span>
              <div><p className="font-bold">Your reflection has been saved.</p><p className="mt-1 text-xs text-white/55">{latestResult.dayWords.join(", ")} · Stress {latestResult.stress}/10 · {latestResult.drawingCompleted} drawing tasks · {latestResult.voiceCompleted} voice phrases</p></div>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#E8F79D]">Updated just now</span>
          </motion.div>
        )}
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D9F06F]">My progress</p>
            <h1 className="font-display mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Good morning, {patientName.split(" ")[0]}.</h1>
            <p className="mt-2 text-sm text-white/55">Small check-ins can reveal meaningful changes.</p>
          </div>
          <button onClick={onStart} className="flex items-center gap-2 self-start rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-white/16 sm:self-auto">
            Start check-in <ChevronRight className="size-4" />
          </button>
        </div>
        <div className="mb-5 space-y-3"><PatientCareCheckInCard caseId={patientCaseId} onStart={onCareCheckin} /><button onClick={onCare} className="flex w-full items-center justify-between rounded-2xl border border-white/15 bg-white/10 p-4 text-left backdrop-blur-xl"><span><span className="block text-sm font-bold">Ask my practitioner</span><span className="mt-1 block text-xs text-white/48">Report a concern, request plan review or ask for an appointment</span></span><ChevronRight className="size-5 text-[#D9F06F]" /></button></div>

        <section className="mb-5 grid gap-4">
          <article className="rounded-[28px] border border-white/15 bg-[#F4F7EB] p-6 text-[#123F4D] shadow-2xl shadow-[#052D3B]/15 sm:p-7">
            <div className="flex h-full flex-col justify-between gap-7 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#147D79]">Weekly PulseKey™</p>
                <h2 className="font-display mt-2 text-3xl font-semibold">Ready for your weekly check-in?</h2>
                <p className="mt-2 text-sm text-[#62777D]">About 3 minutes · Last check-in 6 days ago</p>
              </div>
              <div className="flex shrink-0 flex-col gap-2">
                <button onClick={onStart} className="flex items-center justify-center gap-2 rounded-xl bg-[#123F52] px-5 py-3.5 text-sm font-bold text-white hover:bg-[#1A5367]">Start check-in <ArrowRight className="size-4" /></button>
                <button onClick={onCare} className="rounded-xl border border-[#123F52]/15 bg-white px-5 py-2.5 text-xs font-bold text-[#123F52]">My care plan & messages</button>
              </div>
            </div>
          </article>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Energy", "6.4/10", "Improving", "#D9F06F"],
              ["Sleep quality", "6.8/10", "Improving", "#A9E7E2"],
              ["Stress", "4.7/10", "Lower this month", "#D6CBFF"],
              ["Digestion", "6.2/10", "Broadly stable", "#FFD19D"],
            ].map(([label, value, note, color]) => (
              <article key={label} className="rounded-2xl border border-white/14 bg-white/10 p-4 backdrop-blur-xl">
                <div className="mb-3 size-2 rounded-full" style={{ backgroundColor: color }} />
                <p className="text-xs text-white/48">{label}</p>
                <p className="font-display mt-1 text-2xl font-semibold">{value}</p>
                <p className="mt-1 text-[10px] text-white/42">{note} · self-reported</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-5">
          <div className="space-y-5">
            <article className="rounded-[28px] border border-white/15 bg-white/10 p-5 shadow-2xl shadow-[#052D3B]/15 backdrop-blur-2xl sm:p-7">
              <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D9F06F]">Your rhythm</p>
                  <h2 className="font-display mt-1 text-2xl font-semibold">Wellbeing is trending upward</h2>
                </div>
                <div className="rounded-xl bg-[#D9F06F]/15 px-3 py-2 text-sm font-bold text-[#E5F88B]">+14% in 6 weeks</div>
              </div>
              <div className="h-[270px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={liveProgress} margin={{ top: 8, right: 5, left: -25, bottom: 0 }}>
                    <defs key="patient-chart-defs">
                      <linearGradient id="patientWellbeing" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#D9F06F" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#D9F06F" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid key="patient-grid" stroke="rgba(255,255,255,.08)" vertical={false} />
                    <XAxis key="patient-x" dataKey="week" tick={{ fill: "rgba(255,255,255,.45)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis key="patient-y" domain={[30, 85]} tick={{ fill: "rgba(255,255,255,.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip key="patient-tooltip" contentStyle={{ background: "#07384D", border: "1px solid rgba(255,255,255,.15)", borderRadius: 12 }} />
                    <Area key="patient-wellbeing" id="patient-wellbeing-area" isAnimationActive={false} type="monotone" dataKey="wellbeing" stroke="#D9F06F" strokeWidth={3} fill="url(#patientWellbeing)" name="Wellbeing" />
                    <Area key="patient-energy" id="patient-energy-area" isAnimationActive={false} type="monotone" dataKey="energy" stroke="#8AE2DC" strokeWidth={2} fill="transparent" strokeDasharray="5 5" name="Energy" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex gap-5 text-xs text-white/55">
                <span className="flex items-center gap-2"><i className="h-0.5 w-5 bg-[#D9F06F]" />Wellbeing</span>
                <span className="flex items-center gap-2"><i className="h-0.5 w-5 border-t-2 border-dashed border-[#8AE2DC]" />Energy</span>
              </div>
            </article>

            <div className="grid gap-5 md:grid-cols-2">
              <article className="rounded-[26px] border border-white/15 bg-[#F4F7EB] p-6 text-[#123F4D]">
                <div className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-2xl bg-[#DDEBB6]"><BookOpen className="size-5" /></span>
                  <span className="text-xs font-bold text-[#28726E]">PATTERN FOUND</span>
                </div>
                <h3 className="font-display mt-6 text-2xl font-semibold">Predictability helps you recover.</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#557078]">Your energy was steadier on days when plans were written down before noon.</p>
              </article>
              <article className="rounded-[26px] border border-white/15 bg-white/10 p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-2xl bg-[#FFD19D] text-[#633E1B]"><Bell className="size-5" /></span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold">CARE REMINDER</span>
                </div>
                <h3 className="font-display mt-6 text-2xl font-semibold">Ready to check in with Dr. Morgan?</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/55">{appointmentSet ? "A reminder is set for tomorrow at 9:00 AM." : "It has been 18 days since your last session."}</p>
                <button
                  onClick={() => setAppointmentSet(true)}
                  className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${appointmentSet ? "bg-[#D9F06F]/15 text-[#E5F88B]" : "bg-white text-[#103F52] hover:bg-[#F4F7EB]"}`}
                >
                  {appointmentSet ? <><Check className="size-4" /> Reminder set</> : <><Calendar className="size-4" /> Book a session</>}
                </button>
              </article>
            </div>
          </div>

          <aside className="space-y-5">
            <article className="overflow-hidden rounded-[28px] border border-white/15 bg-[#123F4D]/55 backdrop-blur-2xl">
              <div className="bg-[radial-gradient(circle_at_80%_0%,rgba(217,240,111,.22),transparent_35%)] p-6">
                <div className="flex items-center justify-between">
                  <span className="grid size-12 place-items-center rounded-2xl bg-[#D9F06F] text-[#103F52]"><Wind className="size-6" /></span>
                  <span className="rounded-full border border-[#D9F06F]/25 bg-[#D9F06F]/10 px-3 py-1 text-[10px] font-bold text-[#E8F79D]">RECOMMENDED</span>
                </div>
                <p className="mt-7 text-xs font-bold uppercase tracking-[0.16em] text-white/45">For high-input moments</p>
                <h2 className="font-display mt-2 text-3xl font-semibold">Box breathing</h2>
                <p className="mt-3 text-sm leading-relaxed text-white/58">A guided two-minute reset to settle your nervous system after sensory overload.</p>
                <div className="mt-5 flex items-center gap-4 text-xs text-white/45">
                  <span className="flex items-center gap-1.5"><Clock3 className="size-3.5" /> 2 min</span>
                  <span className="flex items-center gap-1.5"><Sparkles className="size-3.5" /> Matched to you</span>
                </div>
                <button onClick={onBreathing} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#D9F06F] px-4 py-3.5 font-bold text-[#103F52] transition hover:bg-[#E4F68D]">
                  <Play className="size-4 fill-current" /> Start exercise
                </button>
              </div>
            </article>

            <article className="rounded-[26px] border border-white/15 bg-white/10 p-5 backdrop-blur-xl">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#A9E7E2]">Next session</p>
              <div className="mt-4 flex items-center gap-4">
                <div className="grid size-12 place-items-center rounded-full bg-[#D6CBFF] font-bold text-[#3E3568]">EM</div>
                <div>
                  <p className="font-semibold">Dr. Evelyn Morgan</p>
                  <p className="mt-1 text-xs text-white/45">No session booked</p>
                </div>
              </div>
              <div className="mt-5 rounded-xl bg-black/10 p-3 text-xs leading-relaxed text-white/50">Bring up: energy after unexpected plan changes.</div>
            </article>
          </aside>
        </section>
      </main>
    </AppShell>
  );
}

function BreathingExercise({ onBack, onTherapist }: { onBack: () => void; onTherapist: () => void }) {
  const phases = ["Breathe in", "Hold", "Breathe out", "Rest"];
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState(0);
  const [cycles, setCycles] = useState(0);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setPhase((current) => {
        if (current === 3) setCycles((value) => value + 1);
        return (current + 1) % 4;
      });
    }, 4000);
    return () => window.clearInterval(timer);
  }, [running]);

  return (
    <AppShell onHome={onBack} onTherapist={onTherapist} compact>
      <main className="grid min-h-[calc(100vh-85px)] place-items-center pb-10">
        <div className="w-full max-w-3xl text-center">
          <button onClick={onBack} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-white/55 hover:text-white"><ArrowLeft className="size-4" /> Back to my progress</button>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D9F06F]">Guided reset · 2 minutes</p>
          <h1 className="font-display mt-2 text-4xl font-semibold sm:text-5xl">Make a little room to breathe.</h1>
          <div className="relative mx-auto my-10 grid size-64 place-items-center sm:size-72">
            <motion.div
              animate={running ? { scale: phase === 0 || phase === 1 ? 1 : 0.68 } : { scale: 0.72 }}
              transition={{ duration: phase === 1 || phase === 3 ? 0.2 : 3.8, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full border border-[#D9F06F]/50 bg-[#D9F06F]/16 shadow-[0_0_80px_rgba(217,240,111,0.12)]"
            />
            <div className="relative">
              <p className="font-display text-3xl font-semibold">{running ? phases[phase] : "Ready?"}</p>
              <p className="mt-2 text-sm text-white/45">{running ? "4 seconds" : "Find a comfortable position"}</p>
            </div>
          </div>
          <div className="mx-auto flex max-w-sm items-center justify-center gap-3">
            <button onClick={() => setRunning(!running)} className="flex min-h-13 flex-1 items-center justify-center gap-2 rounded-xl bg-[#D9F06F] px-5 font-bold text-[#103F52]">
              {running ? <><Pause className="size-4" /> Pause</> : <><Play className="size-4 fill-current" /> {cycles ? "Continue" : "Begin"}</>}
            </button>
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-left">
              <p className="text-[10px] uppercase tracking-wider text-white/40">Cycles</p>
              <p className="font-display text-lg font-semibold">{cycles}/4</p>
            </div>
          </div>
          <p className="mx-auto mt-7 max-w-md text-sm leading-relaxed text-white/48">Stop anytime if you feel uncomfortable. Let your breath return to its natural pace.</p>
        </div>
      </main>
    </AppShell>
  );
}

function LandingPage() {
  const navigate = useNavigate();
  const [demoRole, setDemoRole] = useState<null | "client" | "practitioner" | "manufacturer">(null);
  const demos = {
    client: ["Patient / Client", "Alex Morgan · Demonstration patient", "/client"],
    practitioner: ["Service Provider", "Dr. Avery Morgan · ND / Therapy demonstration", "/practitioner"],
    manufacturer: ["Manufacturer", "Noreva Naturals · Manufacturer Demo Account", "/manufacturer"],
  } as const;

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-[#20343C]">
      <header className="mx-auto flex max-w-[1320px] items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <ImageWithFallback src={officialLogo} alt="mentAImage official logo" className="h-10 w-auto object-contain sm:h-12" />
        <button
          onClick={() => setDemoRole("client")}
          className="rounded-full border border-[#123F52]/15 bg-white px-4 py-2.5 text-sm font-bold text-[#123F52] shadow-sm transition hover:border-[#17A7A3]/40 hover:text-[#138985]"
        >
          Guided demo
        </button>
      </header>
      <main className="mx-auto grid max-w-[1320px] items-center gap-12 px-5 pb-14 pt-10 sm:px-8 lg:min-h-[calc(100vh-90px)] lg:grid-cols-[0.88fr_1.12fr] lg:px-10 lg:py-16">
        <section>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#E7F7F1] px-3 py-2 text-xs font-bold text-[#147D79]">
            <Sparkles className="size-3.5" />
            PULSEKEY™ BY MENTAIMAGE™
          </div>
          <h1 className="font-display max-w-xl text-5xl font-semibold leading-[0.98] tracking-[-0.04em] text-[#123F52] sm:text-6xl lg:text-7xl">
            Better conversations start <span className="text-[#17A7A3]">between visits.</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-[#587078]">
            PulseKey™ turns brief, client-led check-ins into clearer progress stories and more focused appointments—without replacing practitioner judgment or client autonomy.
          </p>
          <div className="mt-8 flex flex-wrap gap-5 text-xs font-semibold text-[#6A8087]">
            <span className="flex items-center gap-2"><ShieldCheck className="size-4 text-[#17A7A3]" /> Fictional demonstration data</span>
            <span className="flex items-center gap-2"><LockKeyhole className="size-4 text-[#17A7A3]" /> Private by default</span>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <button
            onClick={() => setDemoRole("client")}
            className="group min-h-[330px] overflow-hidden rounded-[30px] border border-[#17A7A3]/15 bg-white p-7 text-left shadow-[0_22px_70px_rgba(18,63,82,0.1)] transition hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(18,63,82,0.16)] focus:outline-none focus:ring-4 focus:ring-[#17A7A3]/20"
          >
            <div className="grid size-14 place-items-center rounded-2xl bg-[#E7F7F1] text-[#118985]"><UserRound className="size-6" /></div>
            <p className="mt-14 text-xs font-bold uppercase tracking-[0.16em] text-[#17A7A3]">Patient / Client</p>
            <h2 className="font-display mt-2 text-3xl font-semibold text-[#123F52]">My health companion</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#667D84]">Track your wellbeing, follow your care plan and stay connected with your practitioner.</p>
            <span className="mt-7 flex items-center gap-2 text-sm font-bold text-[#123F52]">Choose demo account <ArrowRight className="size-4 transition group-hover:translate-x-1" /></span>
          </button>
          <button
            onClick={() => setDemoRole("manufacturer")}
            className="group col-span-full min-h-[180px] rounded-[30px] border border-[#123F52]/10 bg-[#EAF4FC] p-7 text-left shadow-[0_16px_50px_rgba(18,63,82,0.08)] transition hover:-translate-y-1 sm:grid sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-6"
          >
            <div className="grid size-14 place-items-center rounded-2xl bg-[#9375CF] text-white"><BarChart3 className="size-6" /></div>
            <div><p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-[#6F51AD] sm:mt-0">Manufacturer</p><h2 className="font-display mt-1 text-2xl font-semibold text-[#123F52]">Noreva Naturals Intelligence</h2><p className="mt-2 text-sm text-[#607984]">Explore product outcomes, practitioner engagement, research insights and commercial performance.</p></div>
            <ArrowRight className="mt-5 size-5 text-[#123F52] transition group-hover:translate-x-1 sm:mt-0" />
          </button>
          <button
            onClick={() => setDemoRole("practitioner")}
            className="group min-h-[330px] overflow-hidden rounded-[30px] bg-[#123F52] p-7 text-left text-white shadow-[0_22px_70px_rgba(18,63,82,0.18)] transition hover:-translate-y-1 hover:bg-[#174C60] focus:outline-none focus:ring-4 focus:ring-[#17A7A3]/20"
          >
            <div className="grid size-14 place-items-center rounded-2xl bg-[#49C7B5] text-[#123F52]"><Stethoscope className="size-6" /></div>
            <p className="mt-14 text-xs font-bold uppercase tracking-[0.16em] text-[#8EE0D2]">Service Provider</p>
            <h2 className="font-display mt-2 text-3xl font-semibold">Clinical workspace</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/62">Monitor your clients, manage care plans, communicate and review patient progress.</p>
            <span className="mt-7 flex items-center gap-2 text-sm font-bold">Choose demo configuration <ArrowRight className="size-4 transition group-hover:translate-x-1" /></span>
          </button>
          <div className="col-span-full rounded-2xl border border-[#123F52]/10 bg-[#EAF4FC] px-5 py-4 text-center text-sm text-[#536D78]">
            Product discovery prototype · No real clinical data · Not an emergency or diagnostic service
          </div>
        </section>
      </main>
      {demoRole && <div className="fixed inset-0 z-[100] grid place-items-center bg-[#082D3D]/65 p-5 backdrop-blur-sm" onMouseDown={() => setDemoRole(null)}><div onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#17A7A3]">Simulated prototype sign-in</p><h2 className="font-display mt-2 text-3xl font-semibold text-[#123F52]">{demos[demoRole][0]}</h2><p className="mt-2 text-sm text-[#667D84]">This demonstration account does not represent production authentication.</p><button onClick={() => navigate(demos[demoRole][2])} className="mt-6 flex w-full items-center justify-between rounded-2xl border border-[#17A7A3]/25 bg-[#EAF6F1] p-4 text-left"><span><b className="text-sm text-[#123F52]">{demos[demoRole][1]}</b><small className="mt-1 block text-[#667D84]">Open connected demonstration workspace</small></span><ArrowRight className="size-5 text-[#168D88]" /></button><button onClick={() => setDemoRole(null)} className="mt-3 w-full py-2 text-xs font-bold text-[#71858B]">Back to roles</button></div></div>}
    </div>
  );
}

function PatientExperience() {
  const navigate = useNavigate();
  const patientCaseId = window.localStorage.getItem("pulsekey-demo-case") || "C-1001";
  const patientName = patientCaseId === "PK-SAM-01" ? "Sam Rivera" : patientCaseId === "PK-MORGAN-01" ? "Morgan Chen" : "Alex Morgan";
  const [view, setView] = useState<AppView>("patient-dashboard");
  const [deviceMode, setDeviceMode] = useState<"mobile" | "desktop">(() => {
    try { return window.localStorage.getItem("pulsekey-client-device-mode") === "desktop" ? "desktop" : "mobile"; }
    catch { return "mobile"; }
  });
  const changeDeviceMode = (mode: "mobile" | "desktop") => {
    setDeviceMode(mode);
    try { window.localStorage.setItem("pulsekey-client-device-mode", mode); } catch {}
  };

  const [latestResult, setLatestResult] = useState<PulseKeyResult | null>(() => {
    try {
      const saved = window.localStorage.getItem("pulsekey-latest");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const patientHome = () => setView("home");
  const therapist = () => navigate("/practitioner");
  const withRoles = (content: React.ReactNode) => (
    <div className="min-h-screen bg-[#DCE7E3] pb-14">
      <div className="sticky top-0 z-[80] flex justify-center border-b border-[#123F52]/10 bg-[#EFF5F2]/95 px-4 py-2 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-3 text-[#123F52]">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#607D84]">Client view</span>
          <div className="inline-flex rounded-xl border border-[#123F52]/15 bg-white p-1" role="group" aria-label="Patient layout">
            {(["mobile", "desktop"] as const).map((mode) => (
              <button key={mode} type="button" onClick={() => changeDeviceMode(mode)} aria-pressed={deviceMode === mode}
                className={`rounded-lg px-4 py-2 text-xs font-bold capitalize transition ${deviceMode === mode ? "bg-[#123F52] text-white" : "text-[#56727B] hover:bg-[#EAF5F1]"}`}>
                {mode === "mobile" ? "Mobile" : "Desktop"}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className={`mx-auto min-h-screen overflow-hidden shadow-[0_0_70px_rgba(8,45,61,.18)] transition-[max-width] duration-200 ${deviceMode === "mobile" ? "max-w-[480px]" : "max-w-[1480px]"}`}>
        {content}
      </div>

    </div>
  );
  if (view === "checkin") {
    return withRoles(
      <AuthenticPulseKeyFlow
        onExit={patientHome}
        onComplete={(result) => {
          setLatestResult(result);
          window.localStorage.setItem("pulsekey-latest", JSON.stringify(result));
          setView("processing");
        }}
      />
    );
  }
  if (view === "care-checkin") {
    return withRoles(<PatientCareCheckIn caseId={patientCaseId} onBack={() => setView("patient-dashboard")} onComplete={() => setView("patient-dashboard")} />);
  }
  if (view === "processing") {
    return withRoles(<Processing onDone={() => setView("patient-dashboard")} />);
  }
  if (view === "patient-dashboard") {
    return withRoles(<PatientDashboard patientCaseId={patientCaseId} patientName={patientName} onHome={patientHome} onLanding={() => navigate("/")} onStart={() => setView("checkin")} onCareCheckin={() => setView("care-checkin")} onBreathing={() => setView("breathing")} onTherapist={therapist} onCare={() => setView("care")} latestResult={latestResult} />);
  }
  if (view === "breathing") {
    return withRoles(<BreathingExercise onBack={() => setView("patient-dashboard")} onTherapist={therapist} />);
  }
  if (view === "care") {
    if (patientCaseId !== "C-1001") return withRoles(<PersonalizedCareWorkspace caseId={patientCaseId} patientName={patientName} onBack={() => setView("patient-dashboard")} />);
    return withRoles(<PatientCare onBack={() => setView("patient-dashboard")} onPractitioner={() => navigate("/practitioner/ndmaps")} />);
  }
  return withRoles(<PatientHome onStart={() => setView("checkin")} onDashboard={() => setView("patient-dashboard")} onTherapist={therapist} onLanding={() => navigate("/")} />);
}

function PortalRoleSwitcher({ active, onPatient, onPractitioner, onManufacturer }: { active: "patient" | "practitioner"; onPatient: () => void; onPractitioner: () => void; onManufacturer: () => void }) {
  const items = [
    ["patient", "Patient", onPatient],
    ["practitioner", "ND / Practitioner", onPractitioner],
    ["manufacturer", "Noreva Naturals", onManufacturer],
  ] as const;
  return <div className="fixed bottom-3 left-1/2 z-[90] flex -translate-x-1/2 gap-1 border border-white/15 bg-[#092F40]/95 p-1 shadow-2xl backdrop-blur-xl print:hidden">{items.map(([id, label, action]) => <button key={id} onClick={action} className={`whitespace-nowrap px-3 py-2 text-[10px] font-bold transition sm:px-4 ${active === id ? "bg-[#D9F06F] text-[#123F52]" : "text-white/68 hover:bg-white/10 hover:text-white"}`}>{label}</button>)}</div>;
}

function PractitionerExperience() {
  const navigate = useNavigate();
  const location = useLocation();
  
  if (location.pathname.includes("/ndmaps") || location.pathname.includes("/inventory")) return <NDHub initialTab={location.pathname.includes("/inventory") ? "inventory" : "today"} onBack={() => navigate("/practitioner")} onClient={() => navigate("/client")} onManufacturer={() => undefined} />;
  return <TherapistDashboard onBackToCheckIn={() => navigate("/")} onOpenNDMAPS={() => navigate("/practitioner/ndmaps")} onOpenInventory={() => navigate("/practitioner/inventory")} />;
}

function ManufacturerExperience() {
  const navigate = useNavigate();
  return <ManufacturerDashboard onPatient={() => navigate("/")} onPractitioner={() => navigate("/")} />;
}

const router = createBrowserRouter([
  { path: "/", Component: LandingPage },
  { path: "/client/*", Component: PatientExperience },
  { path: "/practitioner/*", Component: PractitionerExperience },
  { path: "/manufacturer/*", Component: ManufacturerExperience },
  { path: "*", Component: LandingPage },
], { basename: import.meta.env.BASE_URL });

export default function App() {
  return <NDMAPSProvider><RouterProvider router={router} /></NDMAPSProvider>;
}
