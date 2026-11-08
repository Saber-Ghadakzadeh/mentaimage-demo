import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, CalendarDays, Check, ChevronRight, Clock3, Plus, Search, Trash2 } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MONITORING_QUESTION_LIBRARY, type AssignedQuestion, type MonitoringProgram, type MonitoringQuestion, useNDMAPS } from "../data/NDMAPSData";

export type DirectoryClient = {
  id: string; name: string; initials: string; focus: string; score: number; change: number; updated: string; color: string;
  age: number; programs: string[]; nextAppointment: string; status: string; question?: string;
};

const scheduleLabel = (question: AssignedQuestion) => {
  if (question.paused) return "Paused";
  if (question.frequency === "daily") return `Daily at ${question.reminderTime}`;
  if (question.frequency === "interval_days") return `Every ${question.interval} days at ${question.reminderTime}`;
  if (question.frequency === "weekly") return question.weekdays.length > 1 ? `Weekly on ${question.weekdays.map((day) => ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][day]).join(", ")}` : "Weekly";
  if (question.frequency === "interval_weeks") return `Every ${question.interval} weeks`;
  if (question.frequency === "monthly") return "Monthly";
  return "Once";
};

export function nextDueDate(question: AssignedQuestion, from = new Date()) {
  if (question.paused) return null;
  const start = new Date(`${question.startDate}T12:00:00`);
  const end = question.endDate ? new Date(`${question.endDate}T23:59:59`) : null;
  const valid = (candidate: Date | null) => candidate && (!end || candidate <= end) ? candidate : null;
  const cursor = new Date(Math.max(start.getTime(), from.getTime()));
  cursor.setHours(12, 0, 0, 0);
  if (question.frequency === "once") return valid(start >= from ? start : null);
  if (question.frequency === "daily") return valid(cursor);
  if (question.frequency === "interval_days") {
    const elapsed = Math.max(0, Math.floor((cursor.getTime() - start.getTime()) / 86400000));
    cursor.setDate(cursor.getDate() + ((question.interval - (elapsed % question.interval)) % question.interval));
    return valid(cursor);
  }
  if (question.frequency === "weekly" && question.weekdays.length) {
    for (let offset = 0; offset < 14; offset++) {
      const candidate = new Date(cursor); candidate.setDate(cursor.getDate() + offset);
      if (question.weekdays.includes(candidate.getDay())) return valid(candidate);
    }
  }
  if (question.frequency === "interval_weeks") { cursor.setDate(cursor.getDate() + question.interval * 7); return valid(cursor); }
  if (question.frequency === "monthly") { cursor.setMonth(cursor.getMonth() + 1); return valid(cursor); }
  return valid(cursor);
}

const newAssignment = (question: MonitoringQuestion): AssignedQuestion => {
  const intervalMatch = question.suggestedFrequency.match(/Every (\d+) days/i);
  return {
    ...question, required: true,
    frequency: question.suggestedFrequency.includes("Daily") ? "daily" : intervalMatch ? "interval_days" : "weekly",
    interval: intervalMatch ? Number(intervalMatch[1]) : 1,
    weekdays: question.suggestedFrequency === "Weekly" ? [0] : [],
    reminderTime: "08:00", startDate: new Date().toISOString().slice(0,10),
  };
};

export function ClientDirectory({ clients, onBack, onOpen }: { clients: DirectoryClient[]; onBack: () => void; onOpen: (client: DirectoryClient) => void }) {
  const data = useNDMAPS();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All patients");
  const filtered = clients.filter((client) => {
    const matchesSearch = `${client.name} ${client.id} ${client.focus} ${client.programs.join(" ")}`.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "All patients" || (filter === "Active monitoring" && (data.monitoringPrograms[client.id]?.some((program) => program.active))) || client.programs.includes(filter) || (filter === "Multiple programs" && client.programs.length > 1) || (filter === "Follow-up due" && client.status.includes("due")) || (filter === "Unanswered messages" && data.messages.some((message) => message.caseId === client.id && message.status === "awaiting_practitioner_reply"));
    return matchesSearch && matchesFilter;
  });
  return <div className="min-h-screen bg-[#F4F8F6] p-4 text-[#20343C] sm:p-7 lg:p-10"><div className="mx-auto max-w-6xl">
    <header className="mb-6 flex items-center gap-4"><button onClick={onBack} className="grid size-10 place-items-center rounded-xl border bg-white"><ArrowLeft className="size-4" /></button><div><p className="text-[10px] font-bold uppercase tracking-[.17em] text-[#17A7A3]">Dr. Avery Morgan · connected directory</p><h1 className="font-display text-3xl font-semibold text-[#123F52]">Clients / Patients</h1></div></header>
    <section className="rounded-3xl border border-[#123F52]/10 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row"><label className="relative flex-1"><Search className="absolute left-3 top-3 size-4 text-[#71858B]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, ID or monitoring priority" className="h-10 w-full rounded-xl border bg-[#F8FAF9] pl-9 pr-3 text-sm outline-none" /></label><select value={filter} onChange={(event) => setFilter(event.target.value)} className="h-10 rounded-xl border bg-white px-3 text-sm">{["All patients","Active monitoring","Sleep","Anxiety","Multiple programs","Follow-up due","Unanswered messages","Missed check-ins","Requires clinical review"].map((item) => <option key={item}>{item}</option>)}</select></div>
      <p className="mt-4 text-xs text-[#71858B]">{filtered.length} patients match</p>
      <div className="mt-3 divide-y divide-[#123F52]/8">{filtered.map((client) => {
        const programs = data.monitoringPrograms[client.id] || [];
        const responses = data.monitoringResponses.filter((response) => response.caseId === client.id);
        return <button key={client.id} onClick={() => onOpen(client)} className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 p-4 text-left hover:bg-[#F5F9F7]"><span className="grid size-11 place-items-center rounded-full text-xs font-bold text-[#123F52]" style={{ backgroundColor: client.color }}>{client.initials}</span><span><span className="flex flex-wrap items-center gap-2"><b className="text-sm">{client.name}</b><small className="rounded-full bg-[#EAF4FC] px-2 py-1 text-[9px] font-bold">{client.id}</small></span><span className="mt-1 block text-xs text-[#71858B]">{client.age} years · {client.programs.join(" + ")} · {client.focus}</span><span className="mt-1 block text-[10px] text-[#87979B]">{programs.reduce((sum, program) => sum + program.questions.length, 0)} assigned questions · {responses.length} saved responses · next appointment {client.nextAppointment}</span></span><span className="text-right"><span className="block text-[10px] font-bold uppercase text-[#17877F]">{client.status}</span><ChevronRight className="ml-auto mt-2 size-4" /></span></button>;
      })}</div>
    </section>
  </div></div>;
}

export function ProgramBuilder({ clients, initialClient, onBack, onClientMode }: { clients: DirectoryClient[]; initialClient: DirectoryClient; onBack: () => void; onClientMode: () => void }) {
  const data = useNDMAPS();
  const [patientId, setPatientId] = useState(initialClient.id);
  const patient = clients.find((client) => client.id === patientId) || clients[0];
  const stored = data.monitoringPrograms[patientId]?.[0];
  const createProgram = (): MonitoringProgram => ({ id: `MP-${patientId}`, caseId: patientId, name: `${patient.programs[0] || "Personalized"} Monitoring`, practitionerName: "Dr. Avery Morgan", active: true, updatedAt: new Date().toISOString().slice(0,10), questions: [] });
  const [program, setProgram] = useState<MonitoringProgram>(stored || createProgram());
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Sleep");
  const [preview, setPreview] = useState(0);
  const [saved, setSaved] = useState(false);
  const [customText, setCustomText] = useState("");
  const [customType, setCustomType] = useState<MonitoringQuestion["type"]>("scale");
  useEffect(() => { setProgram(data.monitoringPrograms[patientId]?.[0] || createProgram()); setPreview(0); setSaved(false); }, [patientId]);
  const library = MONITORING_QUESTION_LIBRARY.filter((question) => (category === "All" || question.domain === category) && question.text.toLowerCase().includes(search.toLowerCase()));
  const updateQuestion = (id: string, changes: Partial<AssignedQuestion>) => setProgram((current) => ({ ...current, questions: current.questions.map((question) => question.id === id ? { ...question, ...changes } : question) }));
  const move = (index: number, direction: -1 | 1) => setProgram((current) => { const questions = [...current.questions]; const target = index + direction; if (target < 0 || target >= questions.length) return current; [questions[index], questions[target]] = [questions[target], questions[index]]; return { ...current, questions }; });
  const applyTemplate = (mode: "nd" | "therapy") => {
    const ids = mode === "nd" ? ["sleep-quality","sleep-hours","energy","adherence","practitioner-note"] : ["anxiety-intensity","anxiety-interference","coping-used","practitioner-note"];
    setProgram((current) => ({ ...current, name: mode === "nd" ? "ND Whole-Person Progress" : "Therapy Between-Session Reflection", questions: ids.map((id) => newAssignment(MONITORING_QUESTION_LIBRARY.find((item) => item.id === id)!)) }));
  };
  const addCustom = () => { if (!customText.trim()) return; const question: MonitoringQuestion = { id: `custom-${Date.now()}`, domain: "Custom questions", text: customText.trim(), type: customType, min: customType === "scale" ? 0 : undefined, max: customType === "scale" ? 10 : undefined, direction: "neutral", suggestedFrequency: "Weekly" }; setProgram((current) => ({ ...current, questions: [...current.questions, newAssignment(question)] })); setCustomText(""); };
  const nextDates = program.questions.map((question) => ({ question, date: nextDueDate(question) })).filter((item) => item.date).sort((a,b) => a.date!.getTime() - b.date!.getTime());
  const nextDate = nextDates[0]?.date;
  const dueTogether = nextDate ? nextDates.filter((item) => item.date?.toDateString() === nextDate.toDateString()).length : 0;
  const currentPreview = program.questions[preview] || null;
  return <div className="min-h-screen bg-[#F4F8F6] p-4 text-[#20343C] sm:p-7 lg:p-10"><div className="mx-auto max-w-[1400px]">
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-4"><button onClick={onBack} className="grid size-10 place-items-center rounded-xl border bg-white"><ArrowLeft className="size-4" /></button><div><p className="text-[10px] font-bold uppercase tracking-[.17em] text-[#17A7A3]">Patient-specific configuration</p><h1 className="font-display text-3xl font-semibold text-[#123F52]">Check-in Program Builder</h1></div></div><button onClick={() => { window.localStorage.setItem("pulsekey-demo-case", patientId); onClientMode(); }} className="rounded-xl bg-[#123F52] px-4 py-2 text-xs font-bold text-white">Open {patient.name}&apos;s patient view</button></header>
    <section className="mb-5 grid gap-4 rounded-3xl border bg-white p-5 shadow-sm lg:grid-cols-[1fr_auto] lg:items-end"><label className="text-xs font-bold">Patient first<select value={patientId} onChange={(event) => setPatientId(event.target.value)} className="mt-2 h-11 w-full rounded-xl border bg-[#F8FAF9] px-3 text-sm">{clients.map((client) => <option key={client.id} value={client.id}>{client.name} · {client.id}</option>)}</select></label><div className="text-xs text-[#657B82]"><b className="text-[#123F52]">Monitoring Programs for {patient.name}</b><p className="mt-1">Priorities: {patient.programs.join(", ")} · {nextDate ? `Next scheduled ${nextDate.toLocaleDateString("en-CA",{weekday:"long",month:"long",day:"numeric"})} · ${dueTogether} questions due` : "No active schedule"}</p><div className="mt-3 flex gap-2"><button onClick={()=>applyTemplate("nd")} className="rounded-lg border px-3 py-2 text-[10px] font-bold">Start from ND Practice</button><button onClick={()=>applyTemplate("therapy")} className="rounded-lg border px-3 py-2 text-[10px] font-bold">Start from Therapy Practice</button></div></div></section>
    <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
      <div className="space-y-5">
        <section className="rounded-3xl border bg-white p-5 shadow-sm"><div className="flex flex-col gap-3 sm:flex-row"><label className="relative flex-1"><Search className="absolute left-3 top-3 size-4 text-[#71858B]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search question library" className="h-10 w-full rounded-xl border bg-[#F8FAF9] pl-9 pr-3 text-sm" /></label><select value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 rounded-xl border px-3 text-sm">{["All","Sleep","Anxiety","Energy & fatigue","Mood","Stress","Digestion","Pain","Lifestyle & wellbeing","Treatment adherence","Side effects & tolerability","Custom questions"].map((item) => <option key={item}>{item}</option>)}</select></div><div className="mt-4 space-y-2">{library.map((question) => { const added = program.questions.some((item) => item.id === question.id); return <div key={question.id} className="flex items-start gap-3 rounded-2xl border bg-[#F9FBF9] p-4"><div className="flex-1"><p className="text-sm font-bold">{question.text}</p><p className="mt-1 text-[10px] text-[#71858B]">{question.domain} · {question.type} · suggested {question.suggestedFrequency}</p></div><button onClick={() => setProgram((current) => ({ ...current, questions: added ? current.questions.filter((item) => item.id !== question.id) : [...current.questions, newAssignment(question)] }))} className={`rounded-xl px-3 py-2 text-xs font-bold ${added ? "bg-[#FFF0ED] text-[#9A4C42]" : "bg-[#123F52] text-white"}`}>{added ? "Remove" : "Add"}</button></div>; })}</div></section>
        <section className="rounded-3xl border bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wider text-[#17A7A3]">Custom question</p><div className="mt-3 grid gap-2 sm:grid-cols-[1fr_160px_auto]"><input value={customText} onChange={(event) => setCustomText(event.target.value)} placeholder="Question wording" className="h-11 rounded-xl border px-3 text-sm" /><select value={customType} onChange={(event) => setCustomType(event.target.value as MonitoringQuestion["type"])} className="h-11 rounded-xl border px-3 text-sm">{["scale","yesno","number","single","multi","text","voice"].map((item) => <option key={item}>{item}</option>)}</select><button onClick={addCustom} className="flex items-center justify-center gap-2 rounded-xl bg-[#17A7A3] px-4 text-xs font-bold text-white"><Plus className="size-4" /> Add</button></div></section>
        <section className="rounded-3xl border bg-white p-5 shadow-sm"><div className="flex justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-[#17A7A3]">Assigned questions</p><h2 className="font-display text-2xl font-semibold text-[#123F52]">{program.questions.length} questions for {patient.name}</h2></div><button onClick={() => { data.saveMonitoringProgram(patientId, { ...program, caseId: patientId, updatedAt: new Date().toISOString().slice(0,10) }); setSaved(true); }} className="rounded-xl bg-[#123F52] px-4 text-xs font-bold text-white">{saved ? "Saved" : "Save & activate"}</button></div><div className="mt-4 space-y-3">{program.questions.map((question,index) => <div key={question.id} className="rounded-2xl border p-4"><div className="flex gap-3"><div className="flex flex-col"><button onClick={() => move(index,-1)}><ArrowUp className="size-4" /></button><button onClick={() => move(index,1)}><ArrowDown className="size-4" /></button></div><div className="flex-1"><p className="text-sm font-bold">{index+1}. {question.text}</p><div className="mt-3 grid gap-2 sm:grid-cols-4"><select value={question.frequency} onChange={(event) => updateQuestion(question.id,{frequency:event.target.value as AssignedQuestion["frequency"]})} className="rounded-lg border p-2 text-xs"><option value="once">Once</option><option value="daily">Daily</option><option value="interval_days">Every X days</option><option value="weekly">Weekly</option><option value="interval_weeks">Every X weeks</option><option value="monthly">Monthly</option></select><input type="number" min="1" value={question.interval} onChange={(event) => updateQuestion(question.id,{interval:+event.target.value})} className="rounded-lg border p-2 text-xs" /><input type="time" value={question.reminderTime} onChange={(event) => updateQuestion(question.id,{reminderTime:event.target.value})} className="rounded-lg border p-2 text-xs" /><button onClick={() => updateQuestion(question.id,{required:!question.required})} className={`rounded-lg border p-2 text-xs font-bold ${question.required?"bg-[#E7F7F1] text-[#147D79]":""}`}>{question.required ? "Required" : "Optional"}</button><label className="text-[9px] font-bold uppercase text-[#71858B]">Start<input type="date" value={question.startDate} onChange={(event)=>updateQuestion(question.id,{startDate:event.target.value})} className="mt-1 w-full rounded-lg border p-2 text-xs font-normal"/></label><label className="text-[9px] font-bold uppercase text-[#71858B]">Optional end<input type="date" value={question.endDate||""} onChange={(event)=>updateQuestion(question.id,{endDate:event.target.value||undefined})} className="mt-1 w-full rounded-lg border p-2 text-xs font-normal"/></label><button onClick={()=>updateQuestion(question.id,{paused:!question.paused})} className={`rounded-lg border p-2 text-xs font-bold ${question.paused?"bg-[#FFF3D9] text-[#8B641D]":""}`}>{question.paused?"Resume":"Pause"}</button></div>{question.frequency==="weekly"&&<div className="mt-2 flex gap-1">{["S","M","T","W","T","F","S"].map((label,day)=><button key={`${label}-${day}`} onClick={()=>updateQuestion(question.id,{weekdays:question.weekdays.includes(day)?question.weekdays.filter((item)=>item!==day):[...question.weekdays,day]})} className={`grid size-8 place-items-center rounded-full text-[10px] font-bold ${question.weekdays.includes(day)?"bg-[#17A7A3] text-white":"bg-[#EEF3F1]"}`}>{label}</button>)}</div>}<p className="mt-2 text-[10px] text-[#71858B]">{scheduleLabel(question)}</p></div><button onClick={()=>setProgram((current)=>({...current,questions:current.questions.filter((item)=>item.id!==question.id)}))}><Trash2 className="size-4 text-[#A65348]" /></button></div></div>)}</div></section>
      </div>
      <aside className="space-y-5">
        <section className="rounded-3xl bg-[#123F52] p-6 text-white shadow-xl"><p className="text-xs font-bold uppercase tracking-wider text-[#8EE0D2]">Live client preview · {patient.name}</p><div className="mt-5 rounded-[26px] bg-[#F8FAF9] p-5 text-[#20343C]">{currentPreview ? <><div className="flex justify-between text-[10px] font-bold text-[#70858B]"><span>{currentPreview.domain.toUpperCase()}</span><span>{preview+1} OF {program.questions.length}</span></div><h3 className="mt-5 font-display text-2xl font-semibold">{currentPreview.text}</h3><PreviewAnswer question={currentPreview} /><p className="mt-4 text-[10px] text-[#71858B]">{scheduleLabel(currentPreview)} · {currentPreview.required?"Required":"Optional"}</p><div className="mt-5 flex justify-between"><button onClick={()=>setPreview(Math.max(0,preview-1))} className="rounded-lg border px-3 py-2 text-xs">Back</button><button onClick={()=>setPreview(Math.min(program.questions.length-1,preview+1))} className="rounded-lg bg-[#17A7A3] px-3 py-2 text-xs font-bold text-white">Next</button></div></>:<p className="py-10 text-center text-sm text-[#71858B]">Add a question to preview it.</p>}</div></section>
        <section className="rounded-3xl border bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wider text-[#17A7A3]">Compact weekly schedule</p><div className="mt-4 grid grid-cols-7 gap-1">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((day,index)=><div key={day} className="rounded-xl bg-[#F3F7F5] p-2 text-center"><p className="text-[9px] font-bold">{day}</p><p className="mt-2 font-display text-lg text-[#123F52]">{program.questions.filter((question)=>question.frequency==="daily"||(question.frequency==="weekly"&&question.weekdays.includes(index))).length}</p></div>)}</div><p className="mt-4 flex items-center gap-2 text-xs text-[#71858B]"><CalendarDays className="size-4" /> Questions due together are grouped into one check-in.</p></section>
      </aside>
    </div>
  </div></div>;
}

function PreviewAnswer({ question }: { question: AssignedQuestion }) {
  if (question.type === "scale") return <div className="mt-6 grid grid-cols-6 gap-1">{[0,2,4,6,8,10].map((value)=><span key={value} className="grid aspect-square place-items-center rounded-lg bg-[#EAF4F1] text-xs font-bold">{value}</span>)}</div>;
  if (question.type === "number") return <div className="mt-6 rounded-xl border bg-white p-4 text-sm text-[#71858B]">Enter number {question.unit&&`in ${question.unit}`}</div>;
  if (question.type === "text" || question.type === "voice") return <div className="mt-6 rounded-xl border bg-white p-4 text-sm text-[#71858B]">{question.type==="voice"?"Tap to record an optional reflection":"Type an optional response…"}</div>;
  return <div className="mt-6 space-y-2">{(question.options||["Yes","No"]).map((option)=><div key={option} className="rounded-xl border bg-white p-3 text-sm font-bold">{option}</div>)}</div>;
}

export function MonitoringPanel({ client }: { client: DirectoryClient }) {
  const data = useNDMAPS();
  const programs = data.monitoringPrograms[client.id] || [];
  const responses = data.monitoringResponses.filter((response) => response.caseId === client.id);
  const selected = programs[0]?.questions[0];
  const trend = selected ? responses.filter((response) => response.questionId === selected.id && typeof response.value === "number").map((response) => ({ date: response.date, value: response.value })) : [];
  return <div className="grid gap-5 xl:grid-cols-[1fr_340px]"><section className="rounded-3xl border bg-white p-6"><p className="text-xs font-bold uppercase text-[#17A7A3]">Assigned monitoring</p><h2 className="font-display mt-1 text-2xl font-semibold text-[#123F52]">{programs[0]?.name || "No active monitoring program"}</h2><div className="mt-4 space-y-2">{programs.flatMap((program)=>program.questions).map((question)=><div key={question.id} className="flex justify-between rounded-xl bg-[#F4F8F6] p-3 text-xs"><b>{question.text}</b><span>{scheduleLabel(question)}</span></div>)}</div><div className="mt-6 h-[280px]">{trend.length ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={trend}><CartesianGrid key="monitor-grid" stroke="#E4ECE9" vertical={false}/><XAxis key="monitor-x" dataKey="date"/><YAxis key="monitor-y" domain={[0,10]}/><Tooltip key="monitor-tip"/><Area key="monitor-area" dataKey="value" stroke="#17A7A3" fill="#17A7A322" connectNulls={false}/></AreaChart></ResponsiveContainer>:<div className="grid h-full place-items-center rounded-2xl bg-[#F7FAF8] text-sm text-[#71858B]">No numeric responses recorded for this question yet.</div>}</div></section><aside className="space-y-3">{[["Assigned programs",programs.length],["Questions",programs.reduce((sum,program)=>sum+program.questions.length,0)],["Completed responses",responses.length],["Review requested",responses.filter((response)=>response.reviewRequested).length]].map(([label,value])=><div key={label} className="rounded-2xl border bg-white p-4"><p className="text-xs text-[#71858B]">{label}</p><b className="mt-2 block font-display text-3xl text-[#123F52]">{value}</b></div>)}</aside></div>;
}
