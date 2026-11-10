import { useMemo, useState } from "react";
import { ArrowLeft, Check, ChevronRight, Clock3, FlaskConical, MessageCircle, ShieldCheck } from "lucide-react";
import { type AssignedQuestion, useNDMAPS } from "../data/NDMAPSData";
import { nextDueDate } from "./PractitionerMonitoring";

export function PatientCareCheckIn({ caseId = "C-1001", onBack, onComplete }: { caseId?: string; onBack: () => void; onComplete: () => void }) {
  const data = useNDMAPS();
  const program = data.monitoringPrograms[caseId]?.[0];
  // Show all active (non-paused) questions so practitioner changes are immediately visible in demo
  const questions = program?.questions.filter((question) => !question.paused) || [];
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number | string[]>>({});
  const [labResults, setLabResults] = useState("");
  const [showLab, setShowLab] = useState(false);
  const [done, setDone] = useState(false);
  const question = questions[step];
  const answer = question ? answers[question.id] : undefined;
  const isLastQuestion = step === questions.length - 1;
  const isLabStep = showLab && step === questions.length;
  const complete = () => {
    if (!program) return;
    data.addMonitoringResponses(questions.filter((item) => answers[item.id] !== undefined).map((item) => ({ caseId, programId: program.id, questionId: item.id, value: answers[item.id], reviewRequested: item.id === "dose-change" || item.id === "possible-effect" })));
    const sleep = Number(answers["sleep-quality"] ?? 6);
    const hours = Number(answers["sleep-hours"] ?? 7);
    const anxiety = Number(answers["anxiety-intensity"] ?? 5);
    const adherence = String(answers["adherence"] ?? "not asked").toLowerCase();
    data.addMicroCheckin({ caseId, sleepQuality0to10: sleep, sleepHours: hours, anxietySeverity0to10: anxiety, planAdherence: adherence, concern: String(answers["practitioner-note"] ?? ""), labResults: labResults.trim() || undefined });
    setDone(true);
  };
  if (!program || !questions.length) return <MobileFrame><button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-white/70"><ArrowLeft className="size-4" /> Back</button><div className="mt-10 rounded-[28px] bg-white p-6 text-[#20343C]"><h1 className="font-display text-3xl font-semibold">Nothing is due right now.</h1><p className="mt-3 text-sm text-[#71858B]">Your practitioner has not assigned an active care check-in.</p></div></MobileFrame>;
  if (done) return <MobileFrame><div className="grid min-h-[75vh] place-items-center text-center"><div><span className="mx-auto grid size-16 place-items-center rounded-full bg-[#D9F06F] text-[#123F52]"><Check className="size-7" /></span><h1 className="font-display mt-5 text-4xl font-semibold">Check-in complete.</h1><p className="mt-3 text-sm text-white/60">Your answers were added to your progress and shared with your practitioner according to your permissions.</p><button onClick={onComplete} className="mt-7 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#123F52]">View my progress</button></div></div></MobileFrame>;
  const totalSteps = questions.length + (showLab ? 1 : 0);
  return <MobileFrame>
    <div className="flex items-center justify-between"><button onClick={isLabStep ? () => setStep(questions.length-1) : step ? () => setStep(step-1) : onBack} className="flex items-center gap-2 text-sm font-bold text-white/70"><ArrowLeft className="size-4" /> Back</button><span className="text-[10px] font-bold uppercase tracking-wider text-[#D9F06F]">{(isLabStep ? questions.length : step)+1} of {totalSteps}</span></div>
    <div className="mt-5 flex gap-1">
      {questions.map((item,index)=><span key={item.id} className={`h-1 flex-1 rounded-full ${index<=step&&!isLabStep?"bg-[#D9F06F]":isLabStep?"bg-[#D9F06F]":"bg-white/15"}`} />)}
      {showLab && <span className={`h-1 flex-1 rounded-full ${isLabStep?"bg-[#D9F06F]":"bg-white/15"}`} />}
    </div>
    {!isLabStep && question && <div className="mt-7 rounded-[28px] border border-white/15 bg-white/10 p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#A9E7E2]">{program.name}</p><span className="flex items-center gap-1 text-[10px] text-white/45"><Clock3 className="size-3" /> ~45 sec</span></div>
      <h1 className="font-display mt-4 text-3xl font-semibold leading-tight">{question.text}</h1>
      <AnswerInput question={question} value={answer} onChange={(value) => setAnswers((current) => ({ ...current, [question.id]: value }))} />
      <button disabled={question.required && answer === undefined} onClick={() => { if (isLastQuestion) { setShowLab(true); setStep(questions.length); } else { setStep(step+1); } }} className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-[#D9F06F] py-3.5 font-bold text-[#123F52] disabled:opacity-35">{isLastQuestion ? "Continue" : "Continue"} <ChevronRight className="size-4" /></button>
    </div>}
    {isLabStep && <div className="mt-7 rounded-[28px] border border-white/15 bg-white/10 p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#A9E7E2]">Optional</p><span className="flex items-center gap-1 text-[10px] text-white/45"><FlaskConical className="size-3" /> Lab results</span></div>
      <h1 className="font-display mt-4 text-3xl font-semibold leading-tight">Any recent lab results to share?</h1>
      <p className="mt-2 text-sm text-white/55">Entirely optional. You own this data. Enter values you'd like your practitioner to see — for example: Ferritin 42, Vitamin D 68, TSH 2.1.</p>
      <textarea value={labResults} onChange={(e) => setLabResults(e.target.value)} placeholder="e.g. Ferritin 42 ng/mL, Vitamin D 68 nmol/L…" className="mt-5 min-h-28 w-full rounded-2xl bg-white p-4 text-sm text-[#20343C] outline-none" />
      <button onClick={complete} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#D9F06F] py-3.5 font-bold text-[#123F52]">Complete check-in <ChevronRight className="size-4" /></button>
      <button onClick={complete} className="mt-3 w-full text-center text-xs text-white/45">Skip — complete without lab results</button>
    </div>}
    <p className="mt-5 flex items-start gap-2 text-[10px] leading-relaxed text-white/45"><ShieldCheck className="mt-0.5 size-3.5 shrink-0" />These questions were assigned by your practitioner. PulseKey does not independently prescribe or approve treatment changes.</p>
  </MobileFrame>;
}

function AnswerInput({ question, value, onChange }: { question: AssignedQuestion; value: string | number | string[] | undefined; onChange: (value: string | number | string[]) => void }) {
  if (question.type === "scale") return <div className="mt-7 grid grid-cols-6 gap-2">{Array.from({length:11},(_,index)=>index).map((number)=><button key={number} onClick={()=>onChange(number)} className={`aspect-square rounded-xl text-sm font-bold ${value===number?"bg-[#A9E7E2] text-[#123F52]":"border border-white/15 bg-white/7"}`}>{number}</button>)}</div>;
  if (question.type === "number") return <label className="mt-7 flex items-center rounded-2xl bg-white p-4 text-[#20343C]"><input autoFocus type="number" min={question.min} max={question.max} value={String(value??"")} onChange={(event)=>onChange(Number(event.target.value))} className="w-full text-3xl font-bold outline-none" /><span className="text-sm text-[#71858B]">{question.unit}</span></label>;
  if (question.type === "text" || question.type === "voice") return <div className="mt-7"><textarea value={String(value??"")} onChange={(event)=>onChange(event.target.value)} placeholder="Optional—share what feels important…" className="min-h-36 w-full rounded-2xl bg-white p-4 text-sm text-[#20343C] outline-none" />{question.type==="voice"&&<button className="mt-2 flex items-center gap-2 text-xs font-bold text-[#A9E7E2]"><MessageCircle className="size-4" /> Record instead</button>}</div>;
  return <div className="mt-7 space-y-2">{(question.options||["Yes","No"]).map((option)=><button key={option} onClick={()=>onChange(option)} className={`w-full rounded-xl border p-4 text-left text-sm font-bold ${value===option?"border-[#D9F06F] bg-[#D9F06F]/15":"border-white/15 bg-white/7"}`}>{option}</button>)}</div>;
}

function MobileFrame({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[linear-gradient(145deg,#0A3B56,#169A94)] p-5 text-white"><div className="mx-auto max-w-md py-4">{children}</div></div>;
}

export function PatientCareCheckInCard({ caseId = "C-1001", onStart }: { caseId?: string; onStart: () => void }) {
  const data = useNDMAPS();
  const program = data.monitoringPrograms[caseId]?.[0];
  const responses = data.monitoringResponses.filter((response) => response.caseId === caseId);
  const activeQuestions = program?.questions.filter((question) => !question.paused) || [];
  const count = activeQuestions.length;
  const domains = useMemo(() => [...new Set(activeQuestions.map((question) => question.domain))], [program, count]);
  const estSeconds = count * 15;
  const estLabel = estSeconds < 60 ? `About ${estSeconds} seconds` : `About ${Math.round(estSeconds / 60)} minute${Math.round(estSeconds / 60) > 1 ? "s" : ""}`;
  return <article className="rounded-[28px] border border-[#D9F06F]/25 bg-[#D9F06F]/12 p-5 backdrop-blur-xl"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#D9F06F]">My Care Check-ins</p><h2 className="font-display mt-2 text-2xl font-semibold">{program?.name || "No check-in assigned"}</h2><p className="mt-2 text-xs text-white/55">{count ? `${count} question${count > 1 ? "s" : ""} · ${estLabel} · ${domains.join(" + ")}` : "Your practitioner has not assigned questions yet."}</p></div><span className="rounded-full bg-white/10 px-2 py-1 text-[9px] font-bold">{responses.length ? `${responses.length} saved` : "READY"}</span></div>{count>0&&<button onClick={onStart} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#D9F06F] py-3 text-sm font-bold text-[#123F52]">Start care check-in <ChevronRight className="size-4" /></button>}</article>;
}

export function PersonalizedCareWorkspace({ caseId, patientName, onBack }: { caseId: string; patientName: string; onBack: () => void }) {
  const data = useNDMAPS();
  const programs = data.monitoringPrograms[caseId] || [];
  const messages = data.messages.filter((message) => message.caseId === caseId);
  const [category,setCategory] = useState("General question");
  const [message,setMessage] = useState("");
  const [sent,setSent] = useState(false);
  const send = () => { data.sendMessage({ caseId, senderRole:"patient", category, body: message || category }); setSent(true); };
  return <div className="min-h-screen bg-[#F5F8F6] p-4 pb-24 text-[#20343C]"><div className="mx-auto max-w-md"><button onClick={onBack} className="grid size-10 place-items-center rounded-xl bg-white shadow-sm"><ArrowLeft className="size-4"/></button><p className="mt-7 text-[10px] font-bold uppercase tracking-wider text-[#17A7A3]">{patientName} · {caseId}</p><h1 className="font-display mt-1 text-3xl font-semibold text-[#123F52]">My care plan & messages</h1><section className="mt-5 rounded-3xl bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase text-[#17A7A3]">Assigned monitoring</p>{programs.length?<div className="mt-3 space-y-2">{programs.map((program)=><div key={program.id} className="rounded-xl bg-[#F1F7F4] p-4"><b>{program.name}</b><p className="mt-1 text-xs text-[#71858B]">{program.questions.length} questions · assigned by {program.practitionerName}</p></div>)}</div>:<p className="mt-3 text-sm text-[#71858B]">No structured program is currently assigned.</p>}<p className="mt-4 text-xs text-[#71858B]">Treatment details appear only when entered and approved by your practitioner. PulseKey does not independently change a medication or supplement plan.</p></section><section className="mt-4 rounded-3xl bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase text-[#17A7A3]">Ask my practitioner</p><div className="mt-3 grid grid-cols-2 gap-2">{["General question","Possible side effect","Review timing or dose","Request appointment"].map((item)=><button key={item} onClick={()=>setCategory(item)} className={`rounded-xl border p-3 text-left text-xs font-bold ${category===item?"border-[#17A7A3] bg-[#E7F7F1]":""}`}>{item}</button>)}</div><textarea value={message} onChange={(event)=>setMessage(event.target.value)} placeholder="Add context for your practitioner…" className="mt-3 min-h-28 w-full rounded-xl border p-3 text-sm"/>{sent?<p className="mt-3 rounded-xl bg-[#E7F7F1] p-3 text-xs font-bold text-[#147D79]">Sent to your practitioner for review.</p>:<button onClick={send} className="mt-3 w-full rounded-xl bg-[#123F52] py-3 text-sm font-bold text-white">Confirm & send</button>}<p className="mt-3 text-[10px] leading-relaxed text-[#8A999D]">This is not continuously monitored. Seek urgent or emergency care through local services when needed.</p></section>{messages.length>0&&<section className="mt-4 rounded-3xl bg-white p-5"><h2 className="font-display text-xl font-semibold">Conversation</h2>{messages.map((item)=><div key={item.id} className="mt-2 rounded-xl bg-[#F1F7F4] p-3 text-xs">{item.body}</div>)}</section>}</div></div>;
}
