import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { HelpCircle, X } from "lucide-react";

type InfoContent = {
  title: string;
  what: string;
  interpret: string;
  action: string;
};

const POPUP_W = 288; // px — matches w-72
const POPUP_MAX_H = 420;
const MARGIN = 12;

function usePopupPosition(btnRef: React.RefObject<HTMLButtonElement | null>, open: boolean) {
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const compute = useCallback(() => {
    const btn = btnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // horizontal: centre on button, clamp to viewport
    let left = r.left + r.width / 2 - POPUP_W / 2;
    left = Math.max(MARGIN, Math.min(left, vw - POPUP_W - MARGIN));
    // vertical: prefer below, fall back to above
    const spaceBelow = vh - r.bottom - MARGIN;
    const spaceAbove = r.top - MARGIN;
    let top: number;
    if (spaceBelow >= Math.min(POPUP_MAX_H, 200)) {
      top = r.bottom + 6;
    } else if (spaceAbove >= Math.min(POPUP_MAX_H, 200)) {
      top = r.top - 6; // will anchor to bottom via transform
    } else {
      top = r.bottom + 6; // just open below and let it scroll
    }
    setPos({ top, left });
  }, [btnRef]);
  useEffect(() => {
    if (!open) return;
    compute();
    window.addEventListener("scroll", compute, true);
    window.addEventListener("resize", compute);
    return () => { window.removeEventListener("scroll", compute, true); window.removeEventListener("resize", compute); };
  }, [open, compute]);
  return pos;
}

export function InfoButton({ info, dark = false }: { info: InfoContent; dark?: boolean }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const pos = usePopupPosition(btnRef, open);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        popupRef.current && !popupRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // determine if popup opens upward (not enough space below)
  const spaceBelow = typeof window !== "undefined"
    ? window.innerHeight - (btnRef.current?.getBoundingClientRect().bottom ?? 0) - MARGIN
    : 999;
  const opensUp = open && spaceBelow < 200 && (btnRef.current?.getBoundingClientRect().top ?? 0) > 200;

  return (
    <>
      <button
        ref={btnRef}
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        title="What does this mean?"
        className={`grid size-5 shrink-0 place-items-center rounded-full transition ${dark ? "text-white/35 hover:text-white/70" : "text-[#71858B]/60 hover:text-[#17A7A3]"}`}
      >
        <HelpCircle className="size-4" />
      </button>
      {open && createPortal(
        <div
          ref={popupRef}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            top: opensUp ? undefined : pos.top,
            bottom: opensUp ? window.innerHeight - pos.top + 12 : undefined,
            left: pos.left,
            width: POPUP_W,
            maxHeight: POPUP_MAX_H,
            zIndex: 9999,
          }}
          className="overflow-y-auto rounded-2xl border border-[#123F52]/12 bg-white p-4 shadow-2xl shadow-[#082D3D]/20"
        >
          <div className="mb-2 flex items-start justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#17A7A3]">{info.title}</p>
            <button onClick={() => setOpen(false)} className="mt-0.5 shrink-0 text-[#71858B] hover:text-[#123F52]"><X className="size-3.5" /></button>
          </div>
          <p className="text-xs leading-relaxed text-[#20343C]">{info.what}</p>
          <div className="mt-3 border-t border-[#123F52]/8 pt-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#6A7E84]">How to interpret</p>
            <p className="mt-1 text-xs leading-relaxed text-[#536B73]">{info.interpret}</p>
          </div>
          <div className="mt-3 border-t border-[#123F52]/8 pt-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#6A7E84]">What to do with it</p>
            <p className="mt-1 text-xs leading-relaxed text-[#536B73]">{info.action}</p>
          </div>
          <div className="mt-3 h-px bg-[#E5EDEA]" />
          <p className="mt-2 text-[9px] text-[#9BABB0]">PulseKey™ insight guide · illustrative data only</p>
        </div>
      )}
    </>
  );
}

// ── Manufacturer info content ──────────────────────────────────────────────

export const MFR_INFO = {
  practitioners: {
    title: "Participating practitioners",
    what: "The number of NDs or other practitioners who have enrolled at least one patient in a monitoring program linked to your products.",
    interpret: "More participating practitioners means broader reach into real-world clinical use. Growth here precedes any downstream outcome or order signal.",
    action: "Track month-over-month. If growth stalls, investigate onboarding friction, education gaps, or whether practitioners see enough value from check-in data to continue enrolling patients.",
  },
  enrolled: {
    title: "Enrolled and monitored cases",
    what: "Total patients currently in an active monitoring program where your product is the primary or secondary exposure. The authorized subset has consented to research data sharing.",
    interpret: "Enrolled cases are your evidence pipeline. A large enrolled pool with low authorization rates suggests consent messaging needs work. A small enrolled pool suggests practitioner adoption is the bottleneck.",
    action: "Prioritize growing authorized cases — these are the records that support outcome analysis, publication preparation, and evidence-informed sales conversations.",
  },
  products: {
    title: "Active products in monitoring",
    what: "Number of distinct products currently being tracked across enrolled patient cases, with the count of discontinuations recorded.",
    interpret: "High discontinuations on a specific product warrant investigation before drawing conclusions — they could reflect patient preference, side effects, or simply completed treatment courses.",
    action: "Click through to see which products have the highest check-in completion and which have the most discontinuations. These two signals together point to your strongest and most vulnerable SKUs.",
  },
  checkins: {
    title: "Patient check-in completion",
    what: "The share of enrolled patients who completed their scheduled check-in at the selected week. This is an operational measure, not a clinical outcome.",
    interpret: "Completion rate is a leading indicator of data quality and practitioner engagement. Low rates mean the outcome picture at that time point is incomplete and potentially biased toward patients who are doing better.",
    action: "If completion falls below 60%, investigate whether patients find the check-in burdensome, whether practitioners are prompting patients to complete it, and whether notification timing needs adjustment.",
  },
  reports: {
    title: "Reviewed patient reports",
    what: "Longitudinal case records that have been reviewed and signed off by the practitioner. These are the highest-quality records in the dataset — structured, permissioned, and clinician-validated.",
    interpret: "A high reviewed-report count relative to enrolled cases suggests strong practitioner engagement. These records are most useful for evidence generation, regulatory submissions, and publication.",
    action: "Use these records as the foundation for any outcome claims. Flag cases with unusual patterns for qualitative follow-up with the practitioner before drawing product conclusions.",
  },
  engagement: {
    title: "Practitioner engagement",
    what: "The share of participating practitioners who placed a direct order in the current observational window. This links clinical activity to commercial behavior.",
    interpret: "Practitioners who both monitor patients and order directly are your highest-value accounts — they are using the product clinically and commercially. Low engagement here suggests the platform is being used for monitoring only without converting to ordering.",
    action: "Identify the gap between clinical-track and commercial-track practitioners. Consider whether a targeted education or incentive program for clinical-track practitioners could move them into direct ordering.",
  },
  orders: {
    title: "Direct manufacturer orders",
    what: "Orders placed directly through the linked practitioner accounts in the current period, across all products.",
    interpret: "Direct orders reduce distribution friction and give you cleaner data on what practitioners are recommending. Growth here outpacing case enrollment suggests some practitioners order without enrolling patients in monitoring.",
    action: "Compare order growth to monitoring enrollment. A widening gap is an opportunity to link commercial accounts to clinical outcomes — the evidence for that linkage is what makes your platform valuable to practitioners.",
  },
  revenue: {
    title: "Total order value",
    what: "Aggregate wholesale CAD value of direct orders in the current filtered period. All values in this demo are fictional.",
    interpret: "Use as a baseline for ROI calculations on the monitoring platform. If platform participation correlates with higher revenue per practitioner, that is a commercial case for expanding enrollment.",
    action: "Compare revenue per practitioner with and without active monitoring programs. If monitored-patient practitioners generate measurably higher order value, that becomes the core pitch for new practitioner acquisition.",
  },
  frequency: {
    title: "Purchasing frequency",
    what: "Average number of orders placed per active practitioner in the period. Reflects ordering habit, not prescribing volume.",
    interpret: "Frequency above 2 per quarter suggests a practitioner who is actively recommending your products and running out of stock. Below 1 per quarter may signal sporadic use or a practitioner ordering through other channels.",
    action: "Flag practitioners with declining frequency for outreach before they churn entirely. Use high-frequency practitioners as case study candidates — they are your most credible peer-to-peer advocates.",
  },
  safety: {
    title: "Administration changes and safety signals",
    what: "Patient-reported timing or frequency changes, and check-ins containing a possible adverse effect entry. These are unverified self-reports, not confirmed adverse events.",
    interpret: "A clustering of administration changes on a specific product often points to unclear dosing instructions rather than product tolerability issues. Possible adverse effect entries require individual case review before any product attribution.",
    action: "Review the full case records for possible-effect entries before escalating. Use administration-change clusters to inform packaging or instruction improvements. Do not use these counts as efficacy or safety conclusions without clinical review.",
  },
  baselineVsLatest: {
    title: "Baseline vs latest check-in",
    what: "Average patient-reported scores at enrollment versus at the most recent check-in, across Sleep, Anxiety, and Energy domains. Scores are on a 0-10 scale.",
    interpret: "This is a descriptive comparison, not a controlled study. Changes reflect the full period under observation and are influenced by regression to the mean, natural course, concurrent treatments, and selection bias toward patients who complete check-ins.",
    action: "Use directional trends to inform practitioner education and product positioning. Flag domains with no improvement or worsening for deeper case-level review. Do not present these averages as evidence of efficacy without a comparison group and appropriate statistical analysis.",
  },
  magnitude: {
    title: "Magnitude of effect by domain",
    what: "For each symptom domain, this shows the average baseline score, the average latest check-in score, the change, and the number of check-ins that contributed to each figure.",
    interpret: "The N shown under each figure is critical — a large-looking change based on few check-ins is unreliable. Anxiety uses a severity scale where lower is better; Sleep and Energy use scales where higher is better.",
    action: "Focus on domains with both meaningful change and sufficient N. These are your strongest evidence candidates. Domains with high N but small change may indicate the product is not the primary driver of that symptom, or that your enrolled population is at ceiling.",
  },
  disposition: {
    title: "Outcome disposition",
    what: "How enrolled cases are categorized at the end of monitoring: improved, stable, discontinued, or other. These are practitioner-recorded assessments.",
    interpret: "A high improved rate is directionally positive but reflects practitioner judgment, not a controlled outcome. Discontinued cases are worth investigating — some are treatment completions, others are tolerability issues.",
    action: "Review discontinued cases individually before drawing product conclusions. Use the improved and stable proportions to frame conversations with practitioners about what outcomes to expect and over what timeframe.",
  },
  checkInCompletion: {
    title: "Check-in completion by product",
    what: "For each product, the share of enrolled patients who completed their scheduled check-in at the selected week. Shown as percentage and raw count.",
    interpret: "Products with low completion rates produce less reliable outcome data. This could mean patients find the check-in less relevant to their experience with that product, or that practitioners assigned it to less engaged patients.",
    action: "If a product consistently shows low completion, investigate whether the assigned questions match what patients actually experience on that product. Work with practitioners to refine the question set.",
  },
  strategyChart: {
    title: "Check-in completion and case volume by product",
    what: "Side-by-side view of how many cases are enrolled per product and what share complete their check-ins. This is a research opportunity map, not a performance ranking.",
    interpret: "Products with high case volume and high completion are your most data-rich — prioritize these for formal observational studies. Products with high case volume but low completion have an engagement problem. Products with low volume may be underprescribed or newly launched.",
    action: "Identify two or three products for deeper analysis based on volume and completion. These are the candidates for a prospective observational protocol that could support publication or regulatory evidence.",
  },
  studyConcept: {
    title: "Study concept and hypothesis",
    what: "A hypothesis generated from patterns in the current dataset. This is not a verified finding — it is a starting point for a formally designed study.",
    interpret: "Hypotheses generated from observational data require pre-specification, a comparison group, and appropriate statistical analysis before any conclusion can be drawn. Treat this as a conversation starter with a clinical advisor, not a result.",
    action: "If the hypothesis aligns with a product you want to build evidence for, consult with a research partner to design a prospective protocol. The PulseKey dataset can provide the real-world infrastructure for that study.",
  },
} satisfies Record<string, InfoContent>;

// ── Practitioner info content ──────────────────────────────────────────────

export const ND_INFO = {
  activeClients: {
    title: "Active clients",
    what: "Clients who have an active monitoring program assigned or have completed a check-in in the past 30 days.",
    interpret: "This is your engaged caseload — the clients generating between-visit data you can act on. The gap between your total caseload and active clients shows how many could benefit from a monitoring program.",
    action: "If this number is growing, your between-visit engagement is working. If it is flat, consider whether more clients would benefit from a structured check-in program assigned through the program builder.",
  },
  newCheckins: {
    title: "New check-ins",
    what: "Patient check-ins submitted since your last login or review session.",
    interpret: "Each check-in is a data point that reduces the information gap between appointments. High volume here means your patients are engaged. Review these before each session to adjust your agenda.",
    action: "Open the client list to see which check-ins flag a concern or contain a question. Prioritize clients with declining scores or a pending question for your next available session.",
  },
  upcomingSessions: {
    title: "Upcoming sessions",
    what: "Scheduled appointments in the next 7 days across your client list.",
    interpret: "Use this as a prompt to review recent check-in data for each upcoming client before the session. A quick 2-minute review often reveals something you would have missed until mid-session.",
    action: "For each upcoming session, review the client's trend chart and most recent check-in. Flag anything that changes your planned agenda so you spend session time on what matters most.",
  },
  followUpsDue: {
    title: "Follow-ups due",
    what: "Clients who have missed a check-in, have a flag in their recent data, or have not had a session in a period you have defined as overdue.",
    interpret: "Follow-ups due is an early warning signal. Clients who miss check-ins are more likely to disengage entirely. Clients with flagged data may need a session sooner than scheduled.",
    action: "Contact overdue clients with a brief message rather than waiting for them to rebook. A short check-in reminder sent proactively is more effective than a gap that grows to several months.",
  },
  questions: {
    title: "Client questions pending",
    what: "Messages or questions submitted by clients through the platform that have not yet been reviewed or responded to.",
    interpret: "Questions submitted between sessions often contain the most clinically relevant information — things the client remembered or noticed but did not raise in person. Review these promptly.",
    action: "Even a brief acknowledgement that you have read the question reduces client anxiety and maintains engagement. Full responses can follow at your next session if the question is not urgent.",
  },
  wellbeingChart: {
    title: "Wellbeing and agency trend",
    what: "A composite trend across the selected client's weekly check-ins, combining self-rated wellbeing and sense of agency over their health. These are patient-reported scores, not clinical measurements.",
    interpret: "Look for direction and consistency rather than individual data points. A plateau after initial improvement is common and worth exploring in session. A sudden drop between check-ins often precedes a cancellation or disengagement.",
    action: "Use this chart as a session opener — 'I noticed your scores dipped around week 4, what was happening then?' It gives clients permission to discuss things they might not raise unprompted.",
  },
  clientScore: {
    title: "Client wellbeing score",
    what: "A composite score from 0 to 100 reflecting the client's most recent self-reported wellbeing check-in. The point change shows movement since the previous check-in.",
    interpret: "The score direction matters more than the absolute value. A score of 55 that was 48 last week is a positive signal; a score of 72 that was 80 last week warrants attention even though it looks high.",
    action: "Clients with two consecutive declining scores should be reviewed before their next scheduled session, not after. A brief message asking how they are doing often surfaces issues early.",
  },
  priorityArea: {
    title: "Priority area",
    what: "A pattern identified across the client's recent check-ins that your clinical judgment should evaluate before the next session. This is generated from check-in data, not from clinical assessment.",
    interpret: "This flag is a prompt, not a diagnosis. It points to a recurring theme in what the client is reporting between visits. Your clinical context determines how much weight to give it.",
    action: "Review the underlying check-in data before acting on this flag. If the pattern matches what you have been observing in sessions, it may be worth adjusting the focus of your next appointment. If it is unexpected, explore it with the client.",
  },
  recommendations: {
    title: "AI-assisted recommendations",
    what: "Suggested between-visit support strategies generated from the client's check-in patterns. These remain private until you review and approve them.",
    interpret: "These are prompts for your clinical thinking, not prescriptions. They are based on patterns in self-reported data and have not been reviewed for clinical appropriateness to this specific client.",
    action: "Review each suggestion against your knowledge of the client before approving. Approved suggestions can be shared with the client as practitioner-endorsed guidance. Decline anything that does not fit the clinical picture.",
  },
  checkInProgram: {
    title: "Check-in program",
    what: "The set of questions currently assigned to this client, configured through the program builder. Only active (non-paused) questions appear in the client's check-in.",
    interpret: "A well-configured program captures the specific domains relevant to this client's care plan. A program with too many questions reduces completion rates; too few misses important signals.",
    action: "Review the program every 4-6 weeks. Pause questions that are no longer relevant and add new ones as the clinical focus shifts. The program builder lets you do this in under 5 minutes.",
  },
} satisfies Record<string, InfoContent>;
