import { createContext, useContext, useMemo, useState } from "react";
import rawSeed from "../../imports/figma_ndmaps_seed.json";

const seed = {
  ...rawSeed,
  schemaVersion: `${rawSeed.schemaVersion}-qc1`,
  practitioners: rawSeed.practitioners.map((item) => item.id === "ND-12" ? { ...item, city: "Montréal", province: "QC", practiceName: "Clinique intégrative Claire Dubois", profession: "Naturopathe (Québec)", licenseStatus: "demo_profile_jurisdiction_reviewed" } : item),
  cases: rawSeed.cases.map((item) => item.practitionerId === "ND-12" ? { ...item, city: "Montréal", province: "QC" } : item),
} as typeof rawSeed;

export type DemoMessage = { id: string; caseId: string; senderRole: string; date: string; body: string; status: string; category?: string };
export type MicroCheckin = { id: string; caseId: string; date: string; sleepQuality0to10: number; sleepHours: number; anxietySeverity0to10: number; planAdherence: string; concern: string; labResults?: string };
export type PlanUpdate = { id: string; caseId: string; date: string; summary: string; approvedBy: string };
type DemoOrder = { id: string; practitionerId: string; date: string; status: "draft" | "submitted" | "received"; lines: Array<{ productId: string; qty: number; unitPriceCAD: number }>; totalCAD: number };
export type MonitoringQuestion = {
  id: string; domain: string; text: string; type: "scale" | "number" | "single" | "multi" | "text" | "voice" | "yesno";
  options?: string[]; min?: number; max?: number; unit?: string; direction?: "higher_better" | "lower_better" | "neutral";
  suggestedFrequency: string;
};
export type AssignedQuestion = MonitoringQuestion & {
  required: boolean; frequency: "once" | "daily" | "interval_days" | "weekly" | "interval_weeks" | "monthly";
  interval: number; weekdays: number[]; reminderTime: string; startDate: string; endDate?: string; paused?: boolean;
};
export type MonitoringProgram = { id: string; caseId: string; name: string; practitionerName: string; active: boolean; questions: AssignedQuestion[]; updatedAt: string };
export type MonitoringResponse = { id: string; caseId: string; programId: string; questionId: string; date: string; value: string | number | string[]; reviewRequested?: boolean };

export const MONITORING_QUESTION_LIBRARY: MonitoringQuestion[] = [
  { id: "sleep-quality", domain: "Sleep", text: "How would you rate your sleep quality last night?", type: "scale", min: 0, max: 10, direction: "higher_better", suggestedFrequency: "Daily" },
  { id: "sleep-hours", domain: "Sleep", text: "Approximately how many hours did you sleep?", type: "number", min: 0, max: 16, unit: "hours", direction: "higher_better", suggestedFrequency: "Daily" },
  { id: "sleep-latency", domain: "Sleep", text: "How long did it take you to fall asleep?", type: "single", options: ["Under 15 min", "15–30 min", "31–60 min", "Over 60 min"], direction: "lower_better", suggestedFrequency: "Daily" },
  { id: "sleep-awakenings", domain: "Sleep", text: "How many times did you wake during the night?", type: "number", min: 0, max: 20, unit: "times", direction: "lower_better", suggestedFrequency: "Daily" },
  { id: "sleep-rested", domain: "Sleep", text: "How rested did you feel when you woke up?", type: "scale", min: 0, max: 10, direction: "higher_better", suggestedFrequency: "Daily" },
  { id: "sleep-impact", domain: "Sleep", text: "How much did poor sleep affect your daytime activities?", type: "scale", min: 0, max: 10, direction: "lower_better", suggestedFrequency: "Every 3 days" },
  { id: "anxiety-intensity", domain: "Anxiety", text: "How intense was your anxiety today?", type: "scale", min: 0, max: 10, direction: "lower_better", suggestedFrequency: "Every 2 days" },
  { id: "anxiety-frequency", domain: "Anxiety", text: "How frequently did you experience anxiety today?", type: "single", options: ["Not at all", "Once", "Several times", "Most of the day"], direction: "lower_better", suggestedFrequency: "Every 2 days" },
  { id: "anxiety-interference", domain: "Anxiety", text: "How much did anxiety interfere with your activities?", type: "scale", min: 0, max: 10, direction: "lower_better", suggestedFrequency: "Every 2 days" },
  { id: "anxiety-panic", domain: "Anxiety", text: "Did you experience an episode of intense fear or panic?", type: "yesno", options: ["Yes", "No"], direction: "neutral", suggestedFrequency: "Every 2 days" },
  { id: "coping-used", domain: "Anxiety", text: "Did you use a coping strategy recommended by your practitioner?", type: "single", options: ["Yes", "Partially", "No"], direction: "neutral", suggestedFrequency: "Weekly" },
  { id: "energy", domain: "Energy & fatigue", text: "How would you rate your energy today?", type: "scale", min: 0, max: 10, direction: "higher_better", suggestedFrequency: "Every 3 days" },
  { id: "adherence", domain: "Treatment adherence", text: "Did you follow your practitioner-approved treatment plan?", type: "single", options: ["Yes", "Partially", "No"], direction: "neutral", suggestedFrequency: "Every 3 days" },
  { id: "dose-change", domain: "Treatment adherence", text: "Did you change the timing, frequency or amount of any supplement?", type: "yesno", options: ["Yes", "No"], direction: "neutral", suggestedFrequency: "Every 3 days" },
  { id: "possible-effect", domain: "Side effects & tolerability", text: "Have you experienced any new symptoms or possible side effects?", type: "yesno", options: ["Yes", "No"], direction: "neutral", suggestedFrequency: "Every 3 days" },
  { id: "practitioner-note", domain: "Lifestyle & wellbeing", text: "Is there anything you want your practitioner to know?", type: "text", direction: "neutral", suggestedFrequency: "Weekly" },
];

const assign = (id: string, frequency: AssignedQuestion["frequency"], interval = 1, weekdays: number[] = []) => ({
  ...MONITORING_QUESTION_LIBRARY.find((item) => item.id === id)!,
  required: true, frequency, interval, weekdays, reminderTime: "08:00", startDate: "2026-11-01",
});
const initialPrograms: Record<string, MonitoringProgram[]> = {
  "C-1001": [{ id: "MP-ALEX-SLEEP", caseId: "C-1001", name: "Sleep Monitoring", practitionerName: "Dr. Avery Morgan", active: true, updatedAt: "2026-11-07", questions: [assign("sleep-quality", "daily"), assign("sleep-hours", "daily"), assign("sleep-impact", "interval_days", 3), assign("adherence", "interval_days", 3)] }],
  "PK-PRIYA-01": [{ id: "MP-PRIYA-SLEEP", caseId: "PK-PRIYA-01", name: "Sleep & Recovery Monitoring", practitionerName: "Dr. Avery Morgan", active: true, updatedAt: "2026-11-07", questions: [assign("sleep-quality", "daily"), assign("sleep-rested", "daily"), assign("sleep-latency", "interval_days", 2), assign("possible-effect", "interval_days", 3)] }],
  "PK-JORDAN-01": [{ id: "MP-JORDAN-ENERGY", caseId: "PK-JORDAN-01", name: "Energy & Fatigue Monitoring", practitionerName: "Dr. Avery Morgan", active: true, updatedAt: "2026-11-07", questions: [assign("energy", "interval_days", 2), assign("adherence", "interval_days", 3), assign("dose-change", "interval_days", 3), assign("practitioner-note", "weekly", 1, [1])] }],
  "PK-OMAR-01": [{ id: "MP-OMAR-SLEEP", caseId: "PK-OMAR-01", name: "Sleep Check-in", practitionerName: "Dr. Avery Morgan", active: true, updatedAt: "2026-11-07", questions: [assign("sleep-quality", "daily"), assign("sleep-hours", "daily"), assign("sleep-awakenings", "daily"), assign("adherence", "interval_days", 3)] }],
  "PK-SAM-01": [{ id: "MP-SAM-ANXIETY", caseId: "PK-SAM-01", name: "Anxiety Monitoring", practitionerName: "Dr. Avery Morgan", active: true, updatedAt: "2026-11-07", questions: [assign("anxiety-intensity", "interval_days", 2), assign("anxiety-interference", "interval_days", 2), assign("coping-used", "weekly", 1, [0]), assign("practitioner-note", "weekly", 1, [0])] }],
  "PK-TAYLOR-01": [{ id: "MP-TAYLOR-MOOD", caseId: "PK-TAYLOR-01", name: "Mood & Wellbeing Monitoring", practitionerName: "Dr. Avery Morgan", active: true, updatedAt: "2026-11-07", questions: [assign("energy", "interval_days", 2), assign("adherence", "interval_days", 3), assign("possible-effect", "weekly", 1, [1])] }],
  "PK-MORGAN-01": [{ id: "MP-MORGAN-MIXED", caseId: "PK-MORGAN-01", name: "Sleep & Anxiety Monitoring", practitionerName: "Dr. Avery Morgan", active: true, updatedAt: "2026-11-07", questions: [assign("sleep-quality", "daily"), assign("sleep-rested", "interval_days", 2), assign("anxiety-intensity", "interval_days", 2), assign("anxiety-interference", "interval_days", 2), assign("adherence", "interval_days", 3)] }],
  "PK-JAMIE-01": [{ id: "MP-JAMIE-MOOD", caseId: "PK-JAMIE-01", name: "Mood & Sleep Monitoring", practitionerName: "Dr. Avery Morgan", active: true, updatedAt: "2026-11-07", questions: [assign("sleep-quality", "daily"), assign("sleep-hours", "daily"), assign("energy", "interval_days", 3), assign("adherence", "interval_days", 3), assign("practitioner-note", "weekly", 1, [3])] }],
};

type ContextValue = {
  seed: typeof seed;
  microCheckins: MicroCheckin[];
  messages: DemoMessage[];
  consents: Record<string, boolean>;
  monitoringQuestions: string[];
  inventory: typeof seed.inventory;
  demoOrders: DemoOrder[];
  planUpdates: PlanUpdate[];
  appointments: typeof seed.appointments;
  monitoringPrograms: Record<string, MonitoringProgram[]>;
  monitoringResponses: MonitoringResponse[];
  addMicroCheckin: (data: Omit<MicroCheckin, "id" | "date">) => void;
  sendMessage: (data: Pick<DemoMessage, "caseId" | "senderRole" | "body" | "category">) => void;
  replyToCase: (caseId: string, body: string) => void;
  setResearchConsent: (caseId: string, allowed: boolean) => void;
  saveMonitoringQuestions: (questions: string[]) => void;
  addPlanUpdate: (caseId: string, summary: string) => void;
  requestAppointment: (caseId: string, date: string) => void;
  createOrder: (productId: string, qty: number) => string;
  submitOrder: (id: string) => void;
  receiveOrder: (id: string) => void;
  saveMonitoringProgram: (caseId: string, program: MonitoringProgram) => void;
  addMonitoringResponses: (responses: Omit<MonitoringResponse, "id" | "date">[]) => void;
  resetDemo: () => void;
};

const Context = createContext<ContextValue | null>(null);
const get = <T,>(key: string, fallback: T): T => {
  try { const value = window.localStorage.getItem(key); return value ? JSON.parse(value) : fallback; } catch { return fallback; }
};
const save = (key: string, value: unknown) => { try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* best effort */ } };

export function NDMAPSProvider({ children }: { children: React.ReactNode }) {
  const initialConsents = Object.fromEntries(seed.cases.map((item) => [item.id, item.consent.allowDeidentifiedResearchAndProductImprovement]));
  const storageVersion = "ndmaps-qc3";
  if (get("ndmaps-storage-version", "") !== storageVersion) {
    ["ndmaps-messages", "ndmaps-consents", "ndmaps-inventory", "ndmaps-appointments", "pulsekey-monitoring-programs", "pulsekey-monitoring-responses"].forEach((key) => window.localStorage.removeItem(key));
    save("ndmaps-storage-version", storageVersion);
  }
  const [microCheckins, setMicroCheckins] = useState<MicroCheckin[]>(() => get("ndmaps-checkins", []));
  const [messages, setMessages] = useState<DemoMessage[]>(() => get("ndmaps-messages", seed.messages as DemoMessage[]));
  const [consents, setConsents] = useState<Record<string, boolean>>(() => get("ndmaps-consents", initialConsents));
  const [monitoringQuestions, setQuestions] = useState<string[]>(() => get("ndmaps-questions", ["Sleep quality", "Sleep duration", "Anxiety / tension", "Plan adherence", "Possible unwanted effects"]));
  const [inventory, setInventory] = useState<typeof seed.inventory>(() => get("ndmaps-inventory", seed.inventory));
  const [demoOrders, setOrders] = useState<DemoOrder[]>(() => get("ndmaps-orders", []));
  const [planUpdates, setPlanUpdates] = useState<PlanUpdate[]>(() => get("ndmaps-plans", []));
  const [appointments, setAppointments] = useState<typeof seed.appointments>(() => get("ndmaps-appointments", seed.appointments));
  const [monitoringPrograms, setMonitoringPrograms] = useState<Record<string, MonitoringProgram[]>>(() => get("pulsekey-monitoring-programs", initialPrograms));
  const [monitoringResponses, setMonitoringResponses] = useState<MonitoringResponse[]>(() => get("pulsekey-monitoring-responses", []));

  const addMicroCheckin: ContextValue["addMicroCheckin"] = (data) => {
    const next = [{ ...data, id: `MICRO-${Date.now()}`, date: new Date().toISOString().slice(0, 10) }, ...microCheckins];
    setMicroCheckins(next); save("ndmaps-checkins", next);
  };
  const sendMessage: ContextValue["sendMessage"] = (data) => {
    const next = [{ ...data, id: `MSG-${Date.now()}`, date: new Date().toISOString().slice(0, 10), status: "awaiting_practitioner_reply" }, ...messages];
    setMessages(next); save("ndmaps-messages", next);
  };
  const replyToCase = (caseId: string, body: string) => {
    const next = [{ id: `REPLY-${Date.now()}`, caseId, senderRole: "practitioner", date: new Date().toISOString().slice(0, 10), body, status: "sent" }, ...messages.map((item) => item.caseId === caseId && item.status === "awaiting_practitioner_reply" ? { ...item, status: "reviewed" } : item)];
    setMessages(next); save("ndmaps-messages", next);
  };
  const setResearchConsent = (caseId: string, allowed: boolean) => {
    const next = { ...consents, [caseId]: allowed }; setConsents(next); save("ndmaps-consents", next);
  };
  const saveMonitoringQuestions = (questions: string[]) => { setQuestions(questions); save("ndmaps-questions", questions); };
  const addPlanUpdate = (caseId: string, summary: string) => {
    const record = seed.cases.find((item) => item.id === caseId);
    const approvedBy = seed.practitioners.find((item) => item.id === record?.practitionerId)?.name || "Authorized practitioner";
    const next = [{ id: `PLAN-${Date.now()}`, caseId, date: new Date().toISOString().slice(0, 10), summary, approvedBy }, ...planUpdates];
    setPlanUpdates(next); save("ndmaps-plans", next);
  };
  const requestAppointment = (caseId: string, date: string) => {
    const practitionerId = seed.cases.find((item) => item.id === caseId)?.practitionerId || "ND-01";
    const next = [{ id: `A-REQ-${Date.now()}`, caseId, practitionerId, date, type: "follow-up request", status: "requested" }, ...appointments];
    setAppointments(next); save("ndmaps-appointments", next);
  };
  const createOrder = (productId: string, qty: number) => {
    const product = seed.products.find((item) => item.productId === productId)!;
    const id = `O-DEMO-${Date.now()}`;
    const next: DemoOrder[] = [{ id, practitionerId: "ND-01", date: new Date().toISOString().slice(0, 10), status: "draft", lines: [{ productId, qty, unitPriceCAD: product.wholesalePriceCAD }], totalCAD: qty * product.wholesalePriceCAD }, ...demoOrders];
    setOrders(next); save("ndmaps-orders", next); return id;
  };
  const submitOrder = (id: string) => { const next = demoOrders.map((item) => item.id === id ? { ...item, status: "submitted" as const } : item); setOrders(next); save("ndmaps-orders", next); };
  const receiveOrder = (id: string) => {
    const order = demoOrders.find((item) => item.id === id); if (!order || order.status === "received") return;
    const nextOrders = demoOrders.map((item) => item.id === id ? { ...item, status: "received" as const } : item);
    const nextInventory = inventory.map((item) => { const line = order.lines.find((entry) => entry.productId === item.productId); return item.practitionerId === order.practitionerId && line ? { ...item, onHand: item.onHand + line.qty, pendingIncoming: Math.max(0, item.pendingIncoming - line.qty) } : item; });
    setOrders(nextOrders); setInventory(nextInventory); save("ndmaps-orders", nextOrders); save("ndmaps-inventory", nextInventory);
  };
  const saveMonitoringProgram = (caseId: string, program: MonitoringProgram) => {
    const current = monitoringPrograms[caseId] || [];
    const nextForPatient = current.some((item) => item.id === program.id) ? current.map((item) => item.id === program.id ? program : item) : [...current, program];
    const next = { ...monitoringPrograms, [caseId]: nextForPatient };
    setMonitoringPrograms(next); save("pulsekey-monitoring-programs", next);
  };
  const addMonitoringResponses = (responses: Omit<MonitoringResponse, "id" | "date">[]) => {
    const date = new Date().toISOString().slice(0, 10);
    const next = [...responses.map((item, index) => ({ ...item, id: `MON-${Date.now()}-${index}`, date })), ...monitoringResponses];
    setMonitoringResponses(next); save("pulsekey-monitoring-responses", next);
  };
  const resetDemo = () => {
    ["ndmaps-checkins", "ndmaps-messages", "ndmaps-consents", "ndmaps-questions", "ndmaps-inventory", "ndmaps-orders", "ndmaps-plans", "ndmaps-appointments", "pulsekey-monitoring-programs", "pulsekey-monitoring-responses"].forEach((key) => window.localStorage.removeItem(key));
    setMicroCheckins([]); setMessages(seed.messages as DemoMessage[]); setConsents(initialConsents); setQuestions(["Sleep quality", "Sleep duration", "Anxiety / tension", "Plan adherence", "Possible unwanted effects"]); setInventory(seed.inventory); setOrders([]); setPlanUpdates([]); setAppointments(seed.appointments); setMonitoringPrograms(initialPrograms); setMonitoringResponses([]);
  };
  const value = useMemo(() => ({ seed, microCheckins, messages, consents, monitoringQuestions, inventory, demoOrders, planUpdates, appointments, monitoringPrograms, monitoringResponses, addMicroCheckin, sendMessage, replyToCase, setResearchConsent, saveMonitoringQuestions, addPlanUpdate, requestAppointment, createOrder, submitOrder, receiveOrder, saveMonitoringProgram, addMonitoringResponses, resetDemo }), [microCheckins, messages, consents, monitoringQuestions, inventory, demoOrders, planUpdates, appointments, monitoringPrograms, monitoringResponses]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export const useNDMAPS = () => {
  const value = useContext(Context); if (!value) throw new Error("NDMAPSProvider is required"); return value;
};

export function downloadCsv(filename: string, rows: Array<Record<string, unknown>>) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const quote = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const csv = [headers.map(quote).join(","), ...rows.map((row) => headers.map((header) => quote(row[header])).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
}
