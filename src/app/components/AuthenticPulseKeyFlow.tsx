import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Check,
  CircleStop,
  Eraser,
  Eye,
  EyeOff,
  Info,
  Mic,
  Paintbrush,
  Play,
  RotateCcw,
  SkipForward,
  Undo2,
  Volume2,
  X,
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import officialLogo from "../../imports/2.png";

export interface PulseKeyResult {
  completedAt: string;
  dayDirection: string;
  dayWords: string[];
  tensionDirection: string;
  tensionWords: string[];
  energyDirection: string;
  energyWords: string[];
  stress: number;
  burnout: number;
  drawingCompleted: number;
  voiceCompleted: number;
  reflections: string[];
  shareScores: boolean;
  shareReflections: boolean;
  shareRawMedia: boolean;
}

interface AuthenticPulseKeyFlowProps {
  onExit: () => void;
  onComplete: (result: PulseKeyResult) => void;
}

type DirectionKind = "day" | "tension" | "energy";
type Stage =
  | "intro"
  | "day-direction"
  | "day-words"
  | "tension-direction"
  | "tension-words"
  | "energy-direction"
  | "energy-words"
  | "stress"
  | "burnout"
  | "drawing-intro"
  | "drawing"
  | "voice-intro"
  | "voice"
  | "reflection"
  | "review";

const directionContent: Record<DirectionKind, { title: string; options: Array<{ label: string; symbol: "down" | "flat" | "up" }> }> = {
  day: {
    title: "How was your day overall?",
    options: [
      { label: "Bad", symbol: "down" },
      { label: "Neutral", symbol: "flat" },
      { label: "Good", symbol: "up" },
    ],
  },
  tension: {
    title: "How tense or relaxed do you feel?",
    options: [
      { label: "Tense", symbol: "down" },
      { label: "Neutral", symbol: "flat" },
      { label: "Relaxed", symbol: "up" },
    ],
  },
  energy: {
    title: "How is your energy right now?",
    options: [
      { label: "Low", symbol: "down" },
      { label: "Neutral", symbol: "flat" },
      { label: "High", symbol: "up" },
    ],
  },
};

const wordBanks: Record<string, string[]> = {
  "day-Bad": ["Difficult", "Heavy", "Frustrating", "Lonely", "Draining", "Disconnected", "Disappointing", "Rough"],
  "day-Neutral": ["Ordinary", "Steady", "Uneventful", "Balanced", "Okay", "Routine", "Quiet", "Mixed"],
  "day-Good": ["Great", "Fun", "Fulfilling", "Smooth", "Exciting", "Connected", "Hopeful", "Productive"],
  "tension-Tense": ["Tight", "On edge", "Restless", "Pressured", "Wound up", "Uneasy", "Strained", "Alert"],
  "tension-Neutral": ["Relaxed", "Settled", "Okay", "Loose", "Mellow", "Soft", "Even", "Present"],
  "tension-Relaxed": ["Calm", "Peaceful", "Grounded", "At ease", "Open", "Rested", "Unhurried", "Comfortable"],
  "energy-Low": ["Drained", "Sluggish", "Heavy", "Sleepy", "Flat", "Spent", "Foggy", "Unmotivated"],
  "energy-Neutral": ["Steady", "Balanced", "Okay", "Moderate", "Even", "Available", "Typical", "Calm"],
  "energy-High": ["Wired", "Buzzing", "Energized", "Hyper", "Excited", "Motivated", "Alert", "Driven"],
};

const stageOrder: Stage[] = [
  "intro",
  "day-direction",
  "day-words",
  "tension-direction",
  "tension-words",
  "energy-direction",
  "energy-words",
  "stress",
  "burnout",
  "drawing-intro",
  "drawing",
  "voice-intro",
  "voice",
  "reflection",
  "review",
];

function FlowLogo() {
  return (
    <div className="inline-flex rounded-xl bg-white px-3 py-2 shadow-sm">
      <ImageWithFallback src={officialLogo} alt="mentAImage official logo" className="h-7 w-auto object-contain" />
    </div>
  );
}

function FlowFrame({
  children,
  stage,
  onBack,
  hideHeader = false,
}: {
  children: React.ReactNode;
  stage: Stage;
  onBack: () => void;
  hideHeader?: boolean;
}) {
  const current = Math.max(0, stageOrder.indexOf(stage) - 1);
  const total = stageOrder.length - 2;
  return (
    <div className="min-h-screen bg-[#104E68] text-white">
      {!hideHeader && (
        <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5 sm:px-8">
          <button onClick={onBack} className="grid size-11 place-items-center rounded-full text-white/85 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#51B5DF]" aria-label="Go back">
            <ArrowLeft className="size-6" />
          </button>
          <FlowLogo />
          <span className="w-11 text-right text-xs font-bold tabular-nums text-white/50">{stage === "intro" ? "" : `${Math.min(current + 1, total)}/${total}`}</span>
        </header>
      )}
      {!hideHeader && stage !== "intro" && (
        <div className="mx-auto h-1 max-w-3xl overflow-hidden bg-white/10">
          <motion.div className="h-full bg-[#53B7DE]" animate={{ width: `${Math.max(5, ((current + 1) / total) * 100)}%` }} />
        </div>
      )}
      {children}
    </div>
  );
}

function DirectionArrow({ type }: { type: "down" | "flat" | "up" }) {
  if (type === "flat") return <span className="block h-1 w-12 rounded-full bg-current" />;
  return <ArrowDown className={`size-11 ${type === "up" ? "rotate-180" : ""}`} strokeWidth={2.2} />;
}

function DirectionQuestion({
  kind,
  selected,
  onSelect,
  onContinue,
}: {
  kind: DirectionKind;
  selected: string;
  onSelect: (value: string) => void;
  onContinue: () => void;
}) {
  const content = directionContent[kind];
  return (
    <main className="mx-auto max-w-2xl px-5 pb-10 pt-10 sm:px-8 sm:pt-14">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#66C7E8]">PulseKey™ check-in</p>
      <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">{content.title}</h1>
      <p className="mt-3 text-base text-white/62">Choose the response that feels closest right now.</p>
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {content.options.map((option) => {
          const active = selected === option.label;
          return (
            <button
              key={option.label}
              onClick={() => onSelect(option.label)}
              className={`flex min-h-36 flex-col items-center justify-center rounded-2xl border-2 transition focus:outline-none focus:ring-4 focus:ring-[#51B5DF]/25 ${
                active ? "border-[#72E2C1] bg-[#72E2C1] text-[#103E53] shadow-xl" : "border-white/25 bg-white/7 text-white hover:border-white/55 hover:bg-white/12"
              }`}
            >
              <DirectionArrow type={option.symbol} />
              <span className="mt-3 text-lg font-bold">{option.label}</span>
              {active && <Check className="absolute size-0" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
      <button disabled={!selected} onClick={onContinue} className="mt-9 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#49A9D2] px-5 text-lg font-bold shadow-lg transition hover:bg-[#5BB9DF] disabled:cursor-not-allowed disabled:opacity-35">
        Continue <ArrowRight className="size-5" />
      </button>
    </main>
  );
}

function WordQuestion({
  kind,
  direction,
  selected,
  custom,
  onSelected,
  onCustom,
  onContinue,
}: {
  kind: DirectionKind;
  direction: string;
  selected: string[];
  custom: string;
  onSelected: (values: string[]) => void;
  onCustom: (value: string) => void;
  onContinue: () => void;
}) {
  const [showMore, setShowMore] = useState(false);
  const words = wordBanks[`${kind}-${direction}`] || [];
  const visible = showMore ? words : words.slice(0, 6);
  const toggle = (word: string) => {
    if (selected.includes(word)) onSelected(selected.filter((item) => item !== word));
    else if (selected.length < 2) onSelected([...selected, word]);
  };
  return (
    <main className="mx-auto max-w-2xl px-5 pb-10 pt-10 sm:px-8 sm:pt-14">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#66C7E8]">Describe it <button title="Words help you remember the character of your week." className="rounded-full text-white/55"><Info className="size-4" /></button></div>
      <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Which word fits best?</h1>
      <p className="mt-3 text-base text-white/62">Pick up to two words. Or type your own.</p>
      <div className="mt-8 flex min-h-36 flex-wrap content-start gap-3">
        {visible.map((word) => (
          <button key={word} onClick={() => toggle(word)} className={`rounded-full border-2 px-5 py-3 text-base font-semibold transition ${selected.includes(word) ? "border-[#72E2C1] bg-[#72E2C1] text-[#103E53]" : "border-white/25 bg-white/7 text-white hover:border-white/50"}`}>
            {word}
          </button>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <button onClick={() => setShowMore(!showMore)} className="text-sm font-bold text-[#76D3F2]">{showMore ? "Fewer words" : "More words"}</button>
        <span className="text-xs text-white/45">{selected.length}/2 selected</span>
      </div>
      <label className="mt-6 block text-sm font-bold text-white/76">Type your own</label>
      <input value={custom} onChange={(event) => onCustom(event.target.value.slice(0, 28))} placeholder="Add a word or short phrase" className="mt-2 w-full rounded-2xl border border-white/25 bg-white/10 p-4 text-white outline-none placeholder:text-white/38 focus:border-[#66C7E8] focus:ring-4 focus:ring-[#51B5DF]/20" />
      <button disabled={!selected.length && !custom.trim()} onClick={onContinue} className="mt-8 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#49A9D2] text-lg font-bold transition hover:bg-[#5BB9DF] disabled:opacity-35">Continue <ArrowRight className="size-5" /></button>
    </main>
  );
}

function NumberQuestion({
  title,
  min,
  max,
  lowLabel,
  highLabel,
  value,
  onChange,
  onContinue,
  onInfo,
}: {
  title: string;
  min: number;
  max: number;
  lowLabel: string;
  highLabel: string;
  value: number;
  onChange: (value: number) => void;
  onContinue: () => void;
  onInfo?: () => void;
}) {
  return (
    <main className="mx-auto max-w-2xl px-5 pb-10 pt-10 sm:px-8 sm:pt-14">
      <div className="flex items-start gap-3">
        <h1 className="flex-1 text-3xl font-bold leading-tight sm:text-4xl">{title}</h1>
        {onInfo && <button onClick={onInfo} className="mt-1 grid size-9 place-items-center rounded-full border border-white/35 text-white/70 hover:bg-white/10" aria-label="More information"><Info className="size-4" /></button>}
      </div>
      <p className="mt-7 text-center text-base text-white/62">{min} = {lowLabel}, {max} = {highLabel}</p>
      <div className={`mx-auto mt-8 grid max-w-xl gap-3 ${max === 10 ? "grid-cols-5" : "grid-cols-5"}`}>
        {Array.from({ length: max - min + 1 }, (_, index) => min + index).map((number) => (
          <button key={number} onClick={() => onChange(number)} className={`aspect-square rounded-2xl border-2 text-xl font-bold shadow-sm transition sm:text-2xl ${value === number ? "border-[#72E2C1] bg-[#72E2C1] text-[#103E53] scale-[1.03]" : "border-white/15 bg-white text-[#172D36] hover:bg-[#EAF6FA]"}`}>{number}</button>
        ))}
      </div>
      <p className="mt-6 text-center text-xs leading-relaxed text-white/45">A self-reported experience for reflection. This is not an independently established diagnosis.</p>
      <button disabled={!value} onClick={onContinue} className="mt-8 min-h-14 w-full rounded-2xl bg-[#49A9D2] text-lg font-bold disabled:opacity-35">Continue</button>
    </main>
  );
}

interface Stroke {
  path: string;
  color: string;
  width: number;
}

const drawingTasks = [
  { title: "Two-Pentagon Copy", instruction: "Copy the two-pentagon figure as accurately as you wish using the reference image shown.", reference: "pentagons" },
  { title: "House Drawing Copy", instruction: "Copy the house drawing as shown using the reference image provided.", reference: "house" },
  { title: "Continuous Line", instruction: "Follow the reference line without lifting your pointer. Prototype demonstration task.", reference: "line" },
  { title: "Three Circles", instruction: "Copy the three overlapping circles. Prototype demonstration task.", reference: "circles" },
  { title: "Simple Star", instruction: "Copy the star shape. Prototype demonstration task.", reference: "star" },
  { title: "Wave Pattern", instruction: "Copy the repeating wave. Prototype demonstration task.", reference: "wave" },
  { title: "Box and Cross", instruction: "Copy the box and diagonal cross. Prototype demonstration task.", reference: "box" },
  { title: "Leaf Shape", instruction: "Copy the simple leaf outline. Prototype demonstration task.", reference: "leaf" },
  { title: "Spiral", instruction: "Copy the spiral. Prototype demonstration task.", reference: "spiral" },
  { title: "Free Drawing", instruction: "Add one final mark that represents this moment. Prototype demonstration task.", reference: "free" },
];

function ReferenceFigure({ type }: { type: string }) {
  return (
    <svg viewBox="0 0 120 90" className="h-full w-full" aria-label={`${type} reference`}>
      <g fill="none" stroke="#1E2C32" strokeWidth="2">
        {type === "pentagons" && <><path d="M18 25 L48 25 L60 49 L37 70 L10 50 Z" /><path d="M57 24 L90 35 L91 66 L57 75 L40 48 Z" /></>}
        {type === "house" && <><path d="M24 38 L59 10 L96 38 L96 78 L24 78 Z" /><path d="M59 10 L96 38 L84 43 L59 10 L24 38" /><path d="M49 78 V57 H65 V78" /><path d="M33 46 H47 V59 H33 Z M73 46 H87 V59 H73 Z" /><path d="M38 46 V59 M33 52 H47 M78 46 V59 M73 52 H87" /><path d="M34 28 V10 H42 V22" /></>}
        {type === "line" && <path d="M10 65 C25 15 45 75 60 30 S95 15 110 60" />}
        {type === "circles" && <><circle cx="42" cy="46" r="24" /><circle cx="62" cy="46" r="24" /><circle cx="82" cy="46" r="24" /></>}
        {type === "star" && <path d="M60 8 L71 36 L103 36 L78 54 L88 82 L60 64 L32 82 L42 54 L17 36 L49 36 Z" />}
        {type === "wave" && <path d="M8 48 Q22 18 36 48 T64 48 T92 48 T120 48" />}
        {type === "box" && <><rect x="25" y="15" width="70" height="62" /><path d="M25 15 L95 77 M95 15 L25 77" /></>}
        {type === "leaf" && <><path d="M15 69 Q48 6 105 22 Q75 78 15 69 Z" /><path d="M17 68 Q55 48 103 23" /></>}
        {type === "spiral" && <path d="M60 46 C60 35 76 34 78 47 C81 65 55 73 40 60 C18 40 40 12 70 15 C104 19 112 56 92 78" />}
        {type === "free" && <path d="M28 59 Q47 22 60 47 Q76 76 95 28" strokeDasharray="4 5" />}
      </g>
    </svg>
  );
}

function DrawingAssessment({ onComplete, onBack }: { onComplete: (count: number) => void; onBack: () => void }) {
  const [task, setTask] = useState(0);
  const [drawings, setDrawings] = useState<Stroke[][]>(() => drawingTasks.map(() => []));
  const [active, setActive] = useState<Stroke | null>(null);
  const [showReference, setShowReference] = useState(true);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [color, setColor] = useState("#111111");
  const [width, setWidth] = useState(6);
  const drawing = useRef(false);
  const taskData = drawingTasks[task];

  const getPoint = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return `${Math.round(((event.clientX - rect.left) / rect.width) * 1200)},${Math.round(((event.clientY - rect.top) / rect.height) * 620)}`;
  };
  const start = (event: React.PointerEvent<SVGSVGElement>) => {
    drawing.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    setActive({ path: `M ${getPoint(event)}`, color, width });
  };
  const move = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!drawing.current) return;
    const next = getPoint(event);
    setActive((current) => current ? { ...current, path: `${current.path} L ${next}` } : current);
  };
  const finish = () => {
    if (active) setDrawings((current) => current.map((items, index) => index === task ? [...items, active] : items));
    drawing.current = false;
    setActive(null);
  };
  const done = () => {
    if (task < drawingTasks.length - 1) {
      setTask(task + 1);
      setShowReference(true);
    } else onComplete(drawings.filter((items) => items.length > 0).length + (active ? 1 : 0));
  };
  return (
    <div className="min-h-screen bg-[#104E68] p-3 text-white sm:p-4">
      <header className="mx-auto flex max-w-[1500px] items-center gap-3 px-1 pb-3">
        <button onClick={onBack} className="grid size-10 place-items-center rounded-full hover:bg-white/10"><ArrowLeft className="size-6" /></button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold sm:text-xl">{taskData.title} <span className="ml-2 font-normal text-white/60">({task + 1}/10)</span></h1>
          <p className="truncate text-xs text-white/62 sm:text-sm">{taskData.instruction}</p>
        </div>
        <button onClick={done} className="rounded-xl bg-[#5F91A6] px-5 py-3 text-sm font-bold hover:bg-[#49A9D2]">{task === 9 ? "Finish" : "Done"}</button>
      </header>
      <div className="relative mx-auto h-[calc(100vh-92px)] min-h-[430px] max-w-[1500px] overflow-hidden rounded-2xl border-2 border-[#3D7891] bg-white shadow-2xl">
        {showReference && <div className="absolute left-4 top-4 z-10 h-28 w-36 rounded-xl border border-slate-200 bg-white p-2 shadow-lg sm:h-32 sm:w-40"><ReferenceFigure type={taskData.reference} /></div>}
        <svg viewBox="0 0 1200 620" preserveAspectRatio="none" className="h-full w-full touch-none cursor-crosshair" onPointerDown={start} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish}>
          {drawings[task].map((stroke, index) => <path key={`${task}-stroke-${index}`} d={stroke.path} fill="none" stroke={stroke.color} strokeWidth={stroke.width} strokeLinecap="round" strokeLinejoin="round" />)}
          {active && <path d={active.path} fill="none" stroke={active.color} strokeWidth={active.width} strokeLinecap="round" strokeLinejoin="round" />}
        </svg>
        <button onClick={() => setToolsOpen(!toolsOpen)} className="absolute right-4 top-4 z-20 grid size-12 place-items-center rounded-full border border-slate-200 bg-white text-[#1583BC] shadow-lg"><Paintbrush className="size-5" /></button>
        {toolsOpen && (
          <div className="absolute right-4 top-20 z-20 w-56 rounded-2xl border border-slate-200 bg-white p-4 text-[#20343C] shadow-xl">
            <div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Brush tools</p><button onClick={() => setToolsOpen(false)}><X className="size-4" /></button></div>
            <p className="mt-4 text-xs font-bold text-slate-500">Colour</p>
            <div className="mt-2 flex flex-wrap gap-2">{["#111111", "#64748B", "#EF4444", "#16A34A", "#2563EB", "#F59E0B", "#A855F7", "#14B8A6"].map((item) => <button key={item} onClick={() => setColor(item)} className={`size-8 rounded-full border-2 ${color === item ? "border-[#49A9D2] ring-2 ring-[#49A9D2]/30" : "border-white"}`} style={{ backgroundColor: item }} aria-label={`Use ${item}`} />)}</div>
            <p className="mt-4 text-xs font-bold text-slate-500">Brush size</p>
            <div className="mt-2 grid grid-cols-4 gap-2">{[2, 5, 9, 14].map((item) => <button key={item} onClick={() => setWidth(item)} className={`grid h-10 place-items-center rounded-lg border ${width === item ? "border-[#49A9D2] bg-[#EAF4FC]" : "border-slate-200"}`}><i className="rounded-full bg-slate-700" style={{ width: item, height: item }} /></button>)}</div>
            <div className="mt-4 grid grid-cols-2 gap-2"><button onClick={() => setDrawings((current) => current.map((items, index) => index === task ? items.slice(0, -1) : items))} className="flex items-center justify-center gap-1 rounded-lg border border-slate-200 py-2 text-xs font-bold"><Undo2 className="size-3.5" /> Undo</button><button onClick={() => setDrawings((current) => current.map((items, index) => index === task ? [] : items))} className="flex items-center justify-center gap-1 rounded-lg border border-slate-200 py-2 text-xs font-bold"><RotateCcw className="size-3.5" /> Reset</button></div>
          </div>
        )}
        <button onClick={() => setShowReference(!showReference)} className="absolute bottom-4 left-4 z-10 flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">{showReference ? <EyeOff className="size-4" /> : <Eye className="size-4" />}{showReference ? "Hide Reference" : "Show Reference"}</button>
        {task >= 2 && <button onClick={done} className="absolute bottom-4 right-4 z-10 flex items-center gap-2 rounded-xl bg-[#EAF4FC] px-4 py-2 text-xs font-bold text-[#315C73]"><SkipForward className="size-4" /> Next demo task</button>}
      </div>
    </div>
  );
}

const voicePhrases = [
  "Kids are talking by the door.",
  "The morning light came through the window.",
  "I can take this one step at a time.",
  "A quiet room can feel very different.",
  "Today I noticed a change in my routine.",
];

function VoiceAssessment({ onComplete }: { onComplete: (count: number) => void }) {
  const [phrase, setPhrase] = useState(0);
  const [state, setState] = useState<"idle" | "recording" | "recorded">("idle");
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (state !== "recording") return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [state]);
  const stop = () => {
    setState("recorded");
    if (seconds < 2) setSeconds(7);
  };
  const next = () => {
    if (phrase === voicePhrases.length - 1) onComplete(5);
    else {
      setPhrase(phrase + 1);
      setState("idle");
      setSeconds(0);
    }
  };
  return (
    <main className="mx-auto flex min-h-[calc(100vh-96px)] max-w-2xl flex-col px-5 pb-8 pt-8 text-center sm:px-8">
      <p className="text-sm font-semibold text-white/55">Voice Exercise</p>
      <h1 className="mt-1 text-2xl font-bold">Phrase {phrase + 1} of 5</h1>
      <div className="mt-8 rounded-3xl border border-white/20 bg-white/10 p-7 shadow-inner sm:p-9"><p className="text-2xl font-semibold leading-relaxed sm:text-3xl">“{voicePhrases[phrase]}”</p></div>
      <div className="mt-8 flex h-24 items-center justify-center gap-1">
        {Array.from({ length: 34 }).map((_, index) => <motion.i key={`voice-bar-${phrase}-${index}`} animate={state === "recording" ? { height: [7, 20 + ((index * 11) % 55), 9] } : { height: state === "recorded" ? 10 + ((index * 7) % 30) : 5 }} transition={{ repeat: state === "recording" ? Infinity : 0, duration: 0.7, delay: index * 0.025 }} className={`w-1 rounded-full ${state === "recording" ? "bg-[#70E2C1]" : "bg-[#66C7E8]/65"}`} />)}
      </div>
      <p className="mt-2 font-mono text-xl font-bold tabular-nums">0:{String(seconds).padStart(2, "0")}</p>
      <p className="mt-2 text-sm text-white/55">{state === "idle" ? "Tap to start recording" : state === "recording" ? "Simulated recording in progress…" : "Phrase recorded in this prototype"}</p>
      <div className="mt-7 flex justify-center">
        {state === "idle" && <button onClick={() => setState("recording")} className="grid size-20 place-items-center rounded-full border-8 border-white bg-[#49A9D2] text-white shadow-2xl"><Mic className="size-8" /></button>}
        {state === "recording" && <button onClick={stop} className="flex items-center gap-2 rounded-full bg-[#F28F82] px-6 py-4 font-bold text-[#512B26]"><CircleStop className="size-5" /> Stop</button>}
        {state === "recorded" && <div className="flex gap-3"><button className="grid size-12 place-items-center rounded-full bg-white text-[#104E68]"><Play className="ml-0.5 size-5" /></button><button onClick={() => { setState("idle"); setSeconds(0); }} className="rounded-xl border border-white/20 px-4 text-sm font-bold">Re-record</button></div>}
      </div>
      <button disabled={state !== "recorded"} onClick={next} className="mt-auto min-h-14 w-full rounded-2xl bg-[#49A9D2] text-lg font-bold disabled:opacity-30">{phrase === 4 ? "Finish voice section" : "Next phrase"}</button>
      <p className="mt-3 text-[11px] text-white/38">Recording is simulated. No voice analysis or diagnosis occurs.</p>
    </main>
  );
}

const reflectionQuestions = [
  "What made this week challenging, in one sentence?",
  "What helped, even a little?",
  "What would you like to carry into next week?",
  "Is there anything you want to remember for your next appointment?",
];

export function AuthenticPulseKeyFlow({ onExit, onComplete }: AuthenticPulseKeyFlowProps) {
  const [stage, setStage] = useState<Stage>("intro");
  const [assessmentMode, setAssessmentMode] = useState<"brief" | "extended">("extended");
  const [dayDirection, setDayDirection] = useState("");
  const [dayWords, setDayWords] = useState<string[]>([]);
  const [dayCustom, setDayCustom] = useState("");
  const [tensionDirection, setTensionDirection] = useState("");
  const [tensionWords, setTensionWords] = useState<string[]>([]);
  const [tensionCustom, setTensionCustom] = useState("");
  const [energyDirection, setEnergyDirection] = useState("");
  const [energyWords, setEnergyWords] = useState<string[]>([]);
  const [energyCustom, setEnergyCustom] = useState("");
  const [stress, setStress] = useState(0);
  const [burnout, setBurnout] = useState(0);
  const [burnoutInfo, setBurnoutInfo] = useState(false);
  const [drawingCompleted, setDrawingCompleted] = useState(0);
  const [voiceCompleted, setVoiceCompleted] = useState(0);
  const [reflectionIndex, setReflectionIndex] = useState(0);
  const [reflections, setReflections] = useState(["", "", "", ""]);
  const [shareScores, setShareScores] = useState(true);
  const [shareReflections, setShareReflections] = useState(false);
  const [shareRawMedia, setShareRawMedia] = useState(false);

  const back = () => {
    if (stage === "intro") onExit();
    else {
      const index = stageOrder.indexOf(stage);
      setStage(stageOrder[Math.max(0, index - 1)]);
    }
  };
  const allWords = (selected: string[], custom: string) => [...selected, ...(custom.trim() ? [custom.trim()] : [])];
  const submit = () => onComplete({
    completedAt: new Date().toISOString(),
    dayDirection,
    dayWords: allWords(dayWords, dayCustom),
    tensionDirection,
    tensionWords: allWords(tensionWords, tensionCustom),
    energyDirection,
    energyWords: allWords(energyWords, energyCustom),
    stress,
    burnout,
    drawingCompleted,
    voiceCompleted,
    reflections,
    shareScores,
    shareReflections,
    shareRawMedia,
  });

  if (stage === "drawing") return <DrawingAssessment onBack={() => setStage("drawing-intro")} onComplete={(count) => { setDrawingCompleted(count); setStage("voice-intro"); }} />;

  return (
    <FlowFrame stage={stage} onBack={back}>
      {stage === "intro" && (
        <main className="mx-auto max-w-2xl px-5 pb-12 pt-8 sm:px-8 sm:pt-12">
          <FlowLogo />
          <h1 className="mt-8 text-4xl font-bold sm:text-5xl">PulseKey™</h1>
          <p className="mt-5 text-lg leading-relaxed text-white/72">A guided multimodal check-in that helps you reflect on stress, energy and your week between appointments.</p>
          <div className="mt-8 space-y-4">
            {[
              ["1", "Rate your current state", "Direction, descriptive words and self-reported ratings"],
              ["2", "Complete guided drawing exercises", "An extended, interactive canvas sequence"],
              ["3", "Read short sentences aloud", "Five simulated voice-recording phrases"],
              ["4", "Finish with a written reflection", "Four short, configurable questions"],
              ["5", "Review what you choose to share", "Raw drawings and voice remain private by default"],
            ].map(([number, title, detail], index) => (
              <div key={number} className="flex gap-4">
                <span className={`grid size-10 shrink-0 place-items-center rounded-full font-bold ${index === 0 ? "bg-[#72E2C1] text-[#104E68]" : "bg-white/17 text-white/72"}`}>{index === 0 ? <Check className="size-5" /> : number}</span>
                <div><p className="font-semibold">{title}</p><p className="mt-1 text-sm leading-relaxed text-white/48">{detail}</p></div>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-2xl border border-[#66C7E8]/25 bg-[#66C7E8]/10 p-4 text-sm leading-relaxed text-white/66"><strong className="text-white">Extended assessment:</strong> this demonstration includes the full drawing and voice sequence and takes longer than the brief recurring check-in.</div>
          <button onClick={() => { setAssessmentMode("extended"); setStage("day-direction"); }} className="mt-7 min-h-14 w-full rounded-2xl bg-[#49A9D2] text-lg font-bold shadow-xl hover:bg-[#5BB9DF]">Start extended assessment</button>
          <button onClick={() => { setAssessmentMode("brief"); setStage("day-direction"); }} className="mt-3 min-h-12 w-full rounded-2xl border border-white/20 bg-white/7 text-sm font-bold text-white/78 hover:bg-white/12">Start brief recurring check-in</button>
        </main>
      )}
      {stage === "day-direction" && <DirectionQuestion kind="day" selected={dayDirection} onSelect={setDayDirection} onContinue={() => setStage("day-words")} />}
      {stage === "day-words" && <WordQuestion kind="day" direction={dayDirection} selected={dayWords} custom={dayCustom} onSelected={setDayWords} onCustom={setDayCustom} onContinue={() => setStage("tension-direction")} />}
      {stage === "tension-direction" && <DirectionQuestion kind="tension" selected={tensionDirection} onSelect={setTensionDirection} onContinue={() => setStage("tension-words")} />}
      {stage === "tension-words" && <WordQuestion kind="tension" direction={tensionDirection} selected={tensionWords} custom={tensionCustom} onSelected={setTensionWords} onCustom={setTensionCustom} onContinue={() => setStage("energy-direction")} />}
      {stage === "energy-direction" && <DirectionQuestion kind="energy" selected={energyDirection} onSelect={setEnergyDirection} onContinue={() => setStage("energy-words")} />}
      {stage === "energy-words" && <WordQuestion kind="energy" direction={energyDirection} selected={energyWords} custom={energyCustom} onSelected={setEnergyWords} onCustom={setEnergyCustom} onContinue={() => setStage("stress")} />}
      {stage === "stress" && <NumberQuestion title="On a scale of 1 to 10, how would you rate your overall stress level this week?" min={1} max={10} lowLabel="not stressed at all" highLabel="extremely stressed" value={stress} onChange={setStress} onContinue={() => setStage("burnout")} />}
      {stage === "burnout" && <NumberQuestion title="How burned out have you felt this week?" min={1} max={5} lowLabel="not burned out" highLabel="very burned out" value={burnout} onChange={setBurnout} onContinue={() => setStage(assessmentMode === "extended" ? "drawing-intro" : "reflection")} onInfo={() => setBurnoutInfo(true)} />}
      {burnoutInfo && <div className="fixed inset-0 z-50 grid place-items-center bg-[#071F2B]/75 p-5 backdrop-blur-sm"><div role="dialog" aria-modal="true" className="max-w-md rounded-3xl bg-white p-6 text-[#20343C] shadow-2xl"><div className="flex items-start justify-between"><h2 className="text-xl font-bold text-[#123F52]">About this question</h2><button onClick={() => setBurnoutInfo(false)} className="grid size-9 place-items-center rounded-full bg-slate-100"><X className="size-4" /></button></div><p className="mt-4 text-sm leading-relaxed text-[#60747B]">This asks about your own experience of exhaustion or depletion. It is not a diagnostic assessment and does not establish a clinical condition.</p><button onClick={() => setBurnoutInfo(false)} className="mt-6 w-full rounded-xl bg-[#104E68] py-3 font-bold text-white">Got it</button></div></div>}
      {stage === "drawing-intro" && (
        <main className="mx-auto max-w-2xl px-5 pb-10 pt-10 sm:px-8 sm:pt-14">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#66C7E8]">Extended assessment · Drawing</p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Guided drawing section</h1>
          <p className="mt-4 text-base leading-relaxed text-white/65">Copy each reference at your own pace. You can draw with a mouse, finger or stylus, change the brush, undo and reset.</p>
          <div className="mt-7 rounded-2xl border border-white/15 bg-white/8 p-5"><div className="flex items-center gap-3"><Paintbrush className="size-6 text-[#66C7E8]" /><div><p className="font-bold">10 navigable tasks</p><p className="mt-1 text-sm text-white/48">The first two reproduce the supplied examples. Remaining tasks are clearly marked prototype demonstrations.</p></div></div></div>
          <button onClick={() => setStage("drawing")} className="mt-8 min-h-14 w-full rounded-2xl bg-[#49A9D2] text-lg font-bold">Open drawing workspace</button>
          <button onClick={() => setStage("voice-intro")} className="mt-3 w-full py-3 text-sm font-bold text-white/55">Skip drawing section</button>
        </main>
      )}
      {stage === "voice-intro" && (
        <main className="mx-auto max-w-2xl px-5 pb-10 pt-10 sm:px-8 sm:pt-14">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#66C7E8]">Extended assessment · Voice</p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">PulseKey™ Voice Section</h1>
          <p className="mt-5 text-lg leading-relaxed text-white/70">Read the short sentence on each page in your normal speaking voice.</p>
          <ul className="mt-7 space-y-5">{["You will read the same sentences every time.", "Find a quiet location.", "Keep the phone approximately 10–20 cm from your mouth.", "Speak naturally."].map((item) => <li key={item} className="flex gap-4 text-base text-white/76"><span className="mt-2 size-2 shrink-0 rounded-full bg-[#49A9D2]" />{item}</li>)}</ul>
          <div className="mt-8 rounded-2xl border border-white/12 bg-white/7 p-4 text-xs leading-relaxed text-white/50">This prototype simulates recording. It does not process your voice or infer a diagnosis.</div>
          <button onClick={() => setStage("voice")} className="mt-7 min-h-14 w-full rounded-2xl bg-[#49A9D2] text-lg font-bold">Continue</button>
        </main>
      )}
      {stage === "voice" && <VoiceAssessment onComplete={(count) => { setVoiceCompleted(count); setStage("reflection"); }} />}
      {stage === "reflection" && (
        <main className="mx-auto flex min-h-[calc(100vh-96px)] max-w-2xl flex-col px-5 pb-6 pt-8 sm:px-8">
          <p className="text-center text-sm text-white/58">Step 3 of 3</p>
          <h1 className="mt-7 text-3xl font-bold">Reflection</h1>
          <p className="mt-2 text-base text-white/60">Question {reflectionIndex + 1} of 4</p>
          <label className="mt-8 text-xl font-medium leading-relaxed sm:text-2xl">{reflectionQuestions[reflectionIndex]}</label>
          <textarea value={reflections[reflectionIndex]} onChange={(event) => setReflections((current) => current.map((value, index) => index === reflectionIndex ? event.target.value : value))} placeholder="Type your answer here…" className="mt-5 min-h-[190px] w-full resize-none rounded-2xl border border-white/25 bg-white/12 p-5 text-base text-white outline-none placeholder:text-white/45 focus:border-[#66C7E8] focus:ring-4 focus:ring-[#51B5DF]/20" />
          <button onClick={() => reflectionIndex < 3 ? setReflectionIndex(reflectionIndex + 1) : setStage("review")} className="sticky bottom-4 mt-auto min-h-14 w-full rounded-2xl bg-[#6B98AB] text-lg font-bold shadow-xl hover:bg-[#49A9D2]">{reflectionIndex < 3 ? "Next question" : "Finish reflection"}</button>
        </main>
      )}
      {stage === "review" && (
        <main className="mx-auto max-w-2xl px-5 pb-12 pt-8 sm:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#66C7E8]">Review and sharing</p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Your check-in is ready.</h1>
          <p className="mt-3 text-base text-white/60">Choose what Dr. Avery Morgan can see. You can change these permissions later.</p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <ReviewCard label="Day" value={`${dayDirection} · ${allWords(dayWords, dayCustom).join(", ")}`} />
            <ReviewCard label="Tension" value={`${tensionDirection} · ${allWords(tensionWords, tensionCustom).join(", ")}`} />
            <ReviewCard label="Energy" value={`${energyDirection} · ${allWords(energyWords, energyCustom).join(", ")}`} />
            <ReviewCard label="Self-ratings" value={`Stress ${stress}/10 · Burnout ${burnout}/5`} />
            <ReviewCard label="Drawing" value={`${drawingCompleted}/10 tasks completed`} />
            <ReviewCard label="Voice" value={`${voiceCompleted}/5 phrases completed`} />
          </div>
          <div className="mt-6 space-y-3">
            <SharingToggle checked={shareScores} onChange={setShareScores} title="Share selected scores, words and trends" detail="Allows longitudinal progress views." />
            <SharingToggle checked={shareReflections} onChange={setShareReflections} title="Share my written reflections" detail="Off unless you explicitly choose to share." />
            <SharingToggle checked={shareRawMedia} onChange={setShareRawMedia} title="Share raw voice recordings and drawings" detail="Off by default. Activity completion can be shared without raw media." />
          </div>
          <button onClick={submit} className="mt-8 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#72E2C1] text-lg font-bold text-[#103E53] shadow-xl"><Check className="size-5" /> Complete check-in</button>
          <p className="mt-4 text-center text-xs leading-relaxed text-white/42">PulseKey™ is not an emergency service or diagnostic tool.</p>
        </main>
      )}
    </FlowFrame>
  );
}

function ReviewCard({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/12 bg-white/8 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-[#66C7E8]">{label}</p><p className="mt-2 text-sm leading-relaxed text-white/78">{value}</p></div>;
}

function SharingToggle({ checked, onChange, title, detail }: { checked: boolean; onChange: (value: boolean) => void; title: string; detail: string }) {
  return <button onClick={() => onChange(!checked)} className="flex w-full items-start gap-4 rounded-2xl border border-white/12 bg-white/7 p-4 text-left"><span className={`mt-0.5 h-6 w-11 shrink-0 rounded-full p-1 transition ${checked ? "bg-[#72E2C1]" : "bg-white/20"}`}><i className={`block size-4 rounded-full bg-white transition ${checked ? "translate-x-5" : ""}`} /></span><span><span className="block text-sm font-bold">{title}</span><span className="mt-1 block text-xs leading-relaxed text-white/45">{detail}</span></span></button>;
}
