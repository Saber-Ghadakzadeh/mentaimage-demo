import { useMemo, useState } from "react";
import {
  Activity, ArrowDownRight, ArrowUpRight, BarChart3, BrainCircuit, Building2,
  CalendarDays, CheckCircle2, ChevronRight, CircleDollarSign, ClipboardList,
  Download, FileDown, FileText, Filter, FlaskConical, LayoutDashboard,
  Menu, Package, PanelLeftClose, Search, ShieldCheck, ShoppingCart, Sparkles,
  TrendingUp, TriangleAlert, Users, X,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { downloadCsv, useNDMAPS } from "../data/NDMAPSData";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import officialLogo from "../../imports/2.png";

type View = "overview" | "outcomes" | "cases" | "network" | "strategy" | "monai";
type AnyRecord = Record<string, any>;

const nav: Array<[View, string, typeof LayoutDashboard]> = [
  ["overview", "Executive overview", LayoutDashboard],
  ["outcomes", "Product outcomes", Activity],
  ["cases", "NDMAPS case explorer", ClipboardList],
  ["network", "Network, orders & sales", Building2],
  ["strategy", "Strategy & research", FlaskConical],
  ["monai", "Ask Monai", BrainCircuit],
];
const CANADIAN_REGIONS = ["AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT"];

const money = (value: number) => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(value);
const percent = (value: number, total: number) => total ? `${Math.round((value / total) * 100)}%` : "0%";

function exportExcel(filename: string, rows: AnyRecord[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const body = [headers.join("\t"), ...rows.map((row) => headers.map((key) => String(row[key] ?? "").replaceAll("\t", " ")).join("\t"))].join("\n");
  const url = URL.createObjectURL(new Blob([body], { type: "application/vnd.ms-excel;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`border border-[#173f50]/10 bg-white shadow-[0_1px_2px_rgba(10,39,52,.03),0_14px_36px_rgba(10,39,52,.045)] ${className}`}>{children}</section>;
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-40 border border-white/10 bg-[#0B2D3B] px-3 py-2 text-xs text-white shadow-2xl">
      <p className="mb-2 font-bold text-[#D9F06F]">{label}</p>
      {payload.map((item: any, index: number) => <p key={`${item.dataKey ?? item.name ?? "series"}-${index}`} className="mt-1 flex justify-between gap-5"><span className="text-white/60">{item.name ?? item.dataKey ?? "Value"}</span><b>{item.value}</b></p>)}
    </div>
  );
}

function CompletionTooltip({ active, payload, week }: any) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  return <div className="max-w-[280px] border border-white/10 bg-[#0B2D3B] p-3 text-xs text-white shadow-2xl"><p className="font-bold text-[#D9F06F]">{row.name} · {row.brand}</p><p className="mt-2 text-white/75">{row.Completed} of {row.Eligible} eligible patients completed their week-{week} check-in ({row["Completion %"]}%).</p></div>;
}

function Kpi({ label, value, note, trend = "up", icon: Icon }: { label: string; value: string | number; note: string; trend?: "up" | "down" | "neutral"; icon: any }) {
  return (
    <Panel className="group min-w-0 p-4 transition hover:-translate-y-0.5 hover:border-[#19A7A2]/30 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="max-w-[150px] text-[10px] font-bold uppercase leading-4 tracking-[0.12em] text-[#6B7F86]">{label}</p>
        <span className="grid size-8 shrink-0 place-items-center bg-[#EAF5F1] text-[#168D88]"><Icon className="size-4" /></span>
      </div>
      <p className="mt-4 font-display text-3xl font-semibold leading-none tracking-tight text-[#123F52]">{value}</p>
      <p className={`mt-3 flex items-center gap-1 text-[11px] font-semibold ${trend === "down" ? "text-[#B45C51]" : trend === "neutral" ? "text-[#6B7F86]" : "text-[#17877F]"}`}>
        {trend === "down" ? <ArrowDownRight className="size-3.5" /> : trend === "up" ? <ArrowUpRight className="size-3.5" /> : <span className="size-1.5 bg-[#8BA09F]" />}
        {note}
      </p>
    </Panel>
  );
}

function SelectFilter({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<[string, string]> }) {
  return (
    <label className="min-w-[155px] flex-1">
      <span className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.14em] text-[#70858B]">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full border border-[#173f50]/12 bg-[#F8FAF8] px-3 text-xs font-semibold text-[#284650] outline-none transition focus:border-[#18A29D]">
        {options.map(([id, name]) => <option value={id} key={id}>{name}</option>)}
      </select>
    </label>
  );
}

export function ManufacturerDashboard({ onPatient, onPractitioner }: { onPatient: () => void; onPractitioner: () => void }) {
  const d = useNDMAPS();
  const seed = d.seed as AnyRecord;
  const [view, setView] = useState<View>("overview");
  const [mobileNav, setMobileNav] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [product, setProduct] = useState("all");
  const [province, setProvince] = useState("all");
  const [practitioner, setPractitioner] = useState("all");
  const [concern, setConcern] = useState("all");
  const [ageBand, setAgeBand] = useState("all");
  const [period, setPeriod] = useState("6");

  const authorized = useMemo(() => seed.cases.filter((item: AnyRecord) => d.consents[item.id] === true), [seed.cases, d.consents]);
  const matchesFilters = (item: AnyRecord) => {
    const ageMatch = ageBand === "all" || (ageBand === "18-34" && item.age < 35) || (ageBand === "35-54" && item.age >= 35 && item.age < 55) || (ageBand === "55+" && item.age >= 55);
    return (product === "all" || item.primaryProductId === product)
      && (province === "all" || item.province === province)
      && (practitioner === "all" || item.practitionerId === practitioner)
      && (concern === "all" || item.concerns.includes(concern))
      && ageMatch;
  };
  const cases = useMemo(() => seed.cases.filter(matchesFilters), [seed.cases, product, province, practitioner, concern, ageBand]);
  const authorizedCases = useMemo(() => authorized.filter(matchesFilters), [authorized, product, province, practitioner, concern, ageBand]);
  const caseIds = useMemo(() => new Set(cases.map((item: AnyRecord) => item.id)), [cases]);
  const authorizedIds = useMemo(() => new Set(authorizedCases.map((item: AnyRecord) => item.id)), [authorizedCases]);
  const allCheckins = useMemo(() => [...seed.checkins, ...d.microCheckins.map((item) => ({ ...item, week: 6, energy0to10: null }))], [seed.checkins, d.microCheckins]);
  const checkins = useMemo(() => allCheckins.filter((item: AnyRecord) => caseIds.has(item.caseId) && item.week <= Number(period)), [allCheckins, caseIds, period]);
  const authorizedCheckins = useMemo(() => allCheckins.filter((item: AnyRecord) => authorizedIds.has(item.caseId) && item.week <= Number(period)), [allCheckins, authorizedIds, period]);
  const practitionerIds = useMemo(() => new Set(cases.map((item: AnyRecord) => item.practitionerId)), [cases]);
  const commercialIds = useMemo(() => new Set(seed.practitioners.filter((item: AnyRecord) => (province === "all" || item.province === province) && (practitioner === "all" || item.id === practitioner)).map((item: AnyRecord) => item.id)), [seed.practitioners, province, practitioner]);
  const orders = useMemo(() => [...seed.orders, ...d.demoOrders].filter((item: AnyRecord) => commercialIds.has(item.practitionerId) && (product === "all" || item.lines?.some((line: AnyRecord) => line.productId === product))), [seed.orders, d.demoOrders, commercialIds, product]);

  const products = seed.products as AnyRecord[];
  const practitioners = seed.practitioners as AnyRecord[];
  const totalOrders = orders.reduce((sum: number, item: AnyRecord) => sum + item.totalCAD, 0);
  const completedReports = seed.reports.filter((item: AnyRecord) => caseIds.has(item.caseId) && item.status === "reviewed").length;
  const completionCount = new Set(checkins.filter((item: AnyRecord) => item.week === Number(period)).map((item: AnyRecord) => item.caseId)).size;
  const completion = `${percent(completionCount, cases.length)} · ${completionCount}/${cases.length}`;
  const activeProducts = new Set(cases.map((item: AnyRecord) => item.primaryProductId)).size;

  const trajectory = useMemo(() => Array.from({ length: Number(period) + 1 }, (_, week) => {
    const rows = checkins.filter((item: AnyRecord) => item.week === week);
    const average = (key: string) => {
      const values = rows.map((item: AnyRecord) => item[key]).filter((value: any) => typeof value === "number");
      return values.length ? Number((values.reduce((a: number, b: number) => a + b, 0) / values.length).toFixed(1)) : null;
    };
    return { week: `W${week}`, Sleep: average("sleepQuality0to10"), Anxiety: average("anxietySeverity0to10"), Energy: average("energy0to10") };
  }), [checkins, period]);

  const productUse = useMemo(() => products.map((item) => {
    const matched = cases.filter((record: AnyRecord) => record.primaryProductId === item.productId);
    const additional = cases.filter((record: AnyRecord) => record.secondaryProductIds?.includes(item.productId)).length;
    const completed = matched.filter((record: AnyRecord) => checkins.some((row: AnyRecord) => row.caseId === record.id && row.week === Number(period))).length;
    return { productId: item.productId, name: item.name, brand: item.brand, Cases: matched.length, Additional: additional, Completed: completed, Eligible: matched.length, "Completion %": matched.length ? +(completed / matched.length * 100).toFixed(1) : 0 };
  }).filter((item) => item.Cases > 0 || item.Additional > 0), [products, cases, checkins, period]);

  const monthlySales = useMemo(() => {
    const byMonth: Record<string, { month: string; Revenue: number; Orders: number }> = {};
    orders.forEach((item: AnyRecord) => {
      const month = item.date.slice(0, 7);
      byMonth[month] ||= { month, Revenue: 0, Orders: 0 };
      byMonth[month].Revenue += item.totalCAD;
      byMonth[month].Orders += 1;
    });
    return Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month));
  }, [orders]);

  const provinceData = useMemo(() => {
    const map: Record<string, { province: string; Practitioners: Set<string>; Cases: number; Revenue: number }> = {};
    practitioners.filter((nd) => commercialIds.has(nd.id)).forEach((nd) => { map[nd.province] ||= { province: nd.province, Practitioners: new Set(), Cases: 0, Revenue: 0 }; map[nd.province].Practitioners.add(nd.id); });
    cases.forEach((item: AnyRecord) => { map[item.province] ||= { province: item.province, Practitioners: new Set(), Cases: 0, Revenue: 0 }; map[item.province].Cases++; });
    orders.forEach((order: AnyRecord) => { const nd = practitioners.find((item) => item.id === order.practitionerId); if (nd) map[nd.province].Revenue += order.totalCAD; });
    return Object.values(map).map((item) => ({ ...item, Practitioners: item.Practitioners.size }));
  }, [practitioners, commercialIds, cases, orders]);

  const outcomeMix = useMemo(() => Object.entries(cases.reduce((map: Record<string, number>, item: AnyRecord) => {
    map[item.outcomeCategory] = (map[item.outcomeCategory] || 0) + 1;
    return map;
  }, {})).map(([name, value], index) => ({ name: name.replaceAll("_", " "), value, fill: ["#24A9A3", "#D9F06F", "#8C78C4", "#F1A57D"][index % 4] })), [cases]);

  const filtersActive = [product, province, practitioner, concern, ageBand].some((value) => value !== "all") || period !== "6";
  const resetFilters = () => { setProduct("all"); setProvince("all"); setPractitioner("all"); setConcern("all"); setAgeBand("all"); setPeriod("6"); };
  const exportFiltered = () => downloadCsv("ndmaps-filtered-authorized-cases.csv", authorizedCases.map((item: AnyRecord) => ({
    caseId: item.id, ageBand: item.age < 35 ? "18-34" : item.age < 55 ? "35-54" : "55+", province: item.province,
    practitionerId: item.practitionerId, concerns: item.concerns.join("|"), productId: item.primaryProductId, outcome: item.outcomeCategory,
  })));

  const sidebar = (
    <aside className={`fixed inset-y-0 left-0 z-50 flex bg-[#0B3041] text-white transition-all duration-300 lg:sticky lg:top-0 lg:h-screen ${mobileNav ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} ${collapsed ? "w-[82px]" : "w-[268px]"}`}>
      <div className="flex w-full flex-col">
        <div className="flex h-[86px] items-center justify-between border-b border-white/10 px-5">
          {!collapsed && <div className="rounded-lg bg-white px-2.5 py-2"><ImageWithFallback src={officialLogo} alt="mentAImage" className="h-7 w-auto object-contain" /></div>}
          <button onClick={() => { setCollapsed(!collapsed); setMobileNav(false); }} className="grid size-9 place-items-center border border-white/10 text-white/65 hover:bg-white/10"><PanelLeftClose className={`size-4 transition ${collapsed ? "rotate-180" : ""}`} /></button>
        </div>
        {!collapsed && <div className="px-5 pb-4 pt-5"><p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#7ADBD3]">Account · Noreva Naturals</p><p className="mt-0.5 text-[8px] text-white/35">Example manufacturer account · illustrative data</p><p className="mt-1.5 font-display text-xl font-semibold">Manufacturer Intelligence</p><p className="mt-1 text-[10px] text-white/40">Role · Manufacturer Administrator</p></div>}
        <nav className="mt-2 space-y-1 px-3">
          {nav.map(([id, label, Icon]) => (
            <button key={id} title={label} onClick={() => { setView(id); setMobileNav(false); }} className={`group flex h-11 w-full items-center gap-3 px-3 text-left text-xs transition ${view === id ? "bg-[#D9F06F] font-bold text-[#123F52]" : "text-white/62 hover:bg-white/7 hover:text-white"}`}>
              <Icon className="size-[17px] shrink-0" /><span className={collapsed ? "hidden" : ""}>{label}</span>{!collapsed && view === id && <ChevronRight className="ml-auto size-3.5" />}
            </button>
          ))}
        </nav>
        <div className="mt-auto border-t border-white/10 p-3">
          {!collapsed && <div className="mb-3 bg-white/5 p-3"><p className="flex items-center gap-2 text-[10px] font-bold text-[#8CE1DA]"><ShieldCheck className="size-3.5" /> RESEARCH ACCESS</p><p className="mt-1 text-[10px] leading-relaxed text-white/42">De-identified, permissioned records only.</p></div>}


        </div>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#F4F4EC] text-[#203840]">
      {mobileNav && <button aria-label="Close navigation" onClick={() => setMobileNav(false)} className="fixed inset-0 z-40 bg-[#061C26]/60 lg:hidden" />}
      <div className={`grid min-h-screen transition-[grid-template-columns] ${collapsed ? "lg:grid-cols-[82px_1fr]" : "lg:grid-cols-[268px_1fr]"}`}>
        {sidebar}
        <div className="min-w-0">
          <header className="sticky top-0 z-30 flex h-[86px] items-center border-b border-[#123F52]/10 bg-[#F4F4EC]/92 px-4 backdrop-blur-xl sm:px-7">
            <button onClick={() => setMobileNav(true)} className="mr-3 grid size-10 place-items-center border border-[#123F52]/10 bg-white lg:hidden"><Menu className="size-5" /></button>
            <div className="min-w-0">
              <p className="truncate text-[9px] font-bold uppercase tracking-[0.18em] text-[#178F89]">Manufacturer intelligence / {nav.find(([id]) => id === view)?.[1]}</p>
              <h1 className="mt-1 truncate font-display text-xl font-semibold text-[#123F52] sm:text-2xl">Welcome to NDMAPS Intelligence</h1>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="hidden border border-[#123F52]/10 bg-white p-1 md:flex">
                
                
                <span className="bg-[#123F52] px-3 py-2 text-[10px] font-bold text-white">Noreva Naturals</span>
              </div>
              <button onClick={() => window.print()} title="Print report" className="grid size-10 place-items-center border border-[#123F52]/10 bg-white text-[#123F52] hover:bg-[#EAF5F1]"><FileDown className="size-4" /></button>
              <div className="hidden bg-[#123F52] px-3 py-2 text-right sm:block"><p className="text-[9px] font-bold text-[#D9F06F]">Noreva Naturals</p><p className="text-[8px] text-white/60">Manufacturer Administrator</p></div>
            </div>
          </header>

          <main className="mx-auto max-w-[1720px] p-4 sm:p-7">
            <div className="mb-5 flex flex-col justify-between gap-3 xl:flex-row xl:items-end">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.13em] text-[#6A7E84]"><CalendarDays className="size-3.5 text-[#19A7A2]" /> Observational window · 8 weeks · Data as of {seed.dataAsOf}</div>
                <p className="mt-2 max-w-2xl text-xs leading-relaxed text-[#6C7E83]">Linked commercial and permissioned clinical follow-up intelligence. Associations are descriptive and do not establish efficacy or causality.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={exportFiltered} className="flex h-10 items-center gap-2 border border-[#123F52]/12 bg-white px-4 text-xs font-bold text-[#123F52] hover:border-[#19A7A2]"><Download className="size-4" /> CSV</button>
                <button onClick={() => exportExcel("ndmaps-filtered-analysis.xls", cases)} className="flex h-10 items-center gap-2 bg-[#123F52] px-4 text-xs font-bold text-white hover:bg-[#195268]"><FileText className="size-4" /> Excel-compatible</button>
              </div>
            </div>

            <Panel className="mb-5 p-4">
              <div className="flex flex-wrap items-end gap-3">
                <span className="mb-2 grid size-8 place-items-center bg-[#E7F3EF] text-[#178F89]"><Filter className="size-4" /></span>
                <SelectFilter label="Product" value={product} onChange={setProduct} options={[["all", "All products"], ...products.map((item) => [item.productId, `${item.brand} · ${item.name}`])]} />
                <SelectFilter label="Province / territory" value={province} onChange={setProvince} options={[["all", "All Canada"], ...CANADIAN_REGIONS.map((item) => [item, item])]} />
                <SelectFilter label="Practitioner" value={practitioner} onChange={setPractitioner} options={[["all", "All practitioners"], ...practitioners.map((item) => [item.id, item.name])]} />
                <SelectFilter label="Concern" value={concern} onChange={setConcern} options={[["all", "All monitored domains"], ["Sleep", "Sleep"], ["Anxiety", "Anxiety"]]} />
                <SelectFilter label="Age band" value={ageBand} onChange={setAgeBand} options={[["all", "All ages"], ["18-34", "18–34"], ["35-54", "35–54"], ["55+", "55+"]]} />
                <SelectFilter label="Follow-up week" value={period} onChange={setPeriod} options={[["4", "Week 4"], ["6", "Week 6"], ["8", "Week 8"]]} />
                {filtersActive && <button onClick={resetFilters} className="h-10 px-3 text-xs font-bold text-[#9B5149] hover:bg-[#FFF0ED]"><X className="mr-1 inline size-3.5" /> Clear all filters</button>}
              </div>
              {filtersActive && <div className="mt-3 flex flex-wrap gap-2">{[product !== "all" && `Product: ${products.find((item) => item.productId === product)?.name}`, province !== "all" && `Region: ${province}`, practitioner !== "all" && `Practitioner: ${practitioners.find((item) => item.id === practitioner)?.name}`, concern !== "all" && `Concern: ${concern}`, ageBand !== "all" && `Age: ${ageBand}`, `Follow-up: week ${period}`].filter(Boolean).map((label) => <span key={String(label)} className="bg-[#EAF5F1] px-2.5 py-1 text-[10px] font-bold text-[#147F79]">{label}</span>)}</div>}
              <div className="mt-3 flex items-center justify-between border-t border-[#123F52]/8 pt-3 text-[10px] text-[#70848A]">
                <span><b className="text-[#123F52]">{cases.length}</b> eligible monitored cases · <b>{authorizedCases.length}</b> authorized case records · {checkins.length} observations</span>
                <span className="hidden sm:inline">All charts and exports reflect these filters</span>
              </div>
            </Panel>
            {!cases.length && view !== "network" && view !== "monai" && <Panel className="mb-5 p-8 text-center"><Filter className="mx-auto size-6 text-[#17918B]" /><h2 className="mt-3 font-display text-2xl font-semibold text-[#123F52]">No monitored cases match these filters</h2><p className="mt-2 text-xs text-[#71858B]">Try clearing one or more clinical filters. Commercial account results remain separate.</p></Panel>}

            {view === "overview" && (
              <Overview
                cases={cases} checkins={checkins} orders={orders} activeProducts={activeProducts}
                completion={completion} completedReports={completedReports} totalOrders={totalOrders}
                practitioners={practitionerIds.size} trajectory={trajectory} productUse={productUse}
                provinceData={provinceData} monthlySales={monthlySales} period={period}
                onCases={() => setView("cases")} onNetwork={() => setView("network")}
              />
            )}
            {view === "outcomes" && <Outcomes cases={cases} checkins={checkins} trajectory={trajectory} productUse={productUse} outcomeMix={outcomeMix} products={products} onCases={() => setView("cases")} />}
            {view === "cases" && <CaseExplorer cases={authorizedCases} checkins={authorizedCheckins} products={products} seed={seed} />}
            {view === "network" && <Network practitioners={practitioners.filter((item) => commercialIds.has(item.id))} orders={orders} seed={seed} provinceData={provinceData} />}
            {view === "strategy" && <Strategy productUse={productUse} provinceData={provinceData} checkins={checkins} cases={cases} />}
            {view === "monai" && <Monai cases={cases} checkins={checkins} orders={orders} products={products} practitioners={practitioners} onCases={() => setView("cases")} onExport={exportFiltered} />}
          </main>
        </div>
      </div>
    </div>
  );
}

function Overview({ cases, checkins, orders, activeProducts, completion, completedReports, totalOrders, practitioners, trajectory, productUse, provinceData, monthlySales, onCases, onNetwork, period }: AnyRecord) {
  const changed = checkins.filter((item: AnyRecord) => item.reportedDoseChange).length;
  const adverse = checkins.filter((item: AnyRecord) => item.newOrWorsenedSymptoms).length;
  const discontinued = cases.filter((item: AnyRecord) => item.outcomeCategory === "discontinued").length;
  const retention = percent(new Set(orders.map((item: AnyRecord) => item.practitionerId)).size, practitioners || 1);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="Participating practitioners" value={practitioners} note="12 in network" icon={Users} />
        <Kpi label="Enrolled / monitored" value={`${cases.length} / 135`} note="Permissioned research view" trend="neutral" icon={ShieldCheck} />
        <Kpi label="Active products" value={activeProducts} note={`${discontinued} discontinuations`} trend={discontinued ? "down" : "neutral"} icon={Package} />
        <Kpi label={`Week-${period} patient check-ins`} value={completion} note="Completed / all eligible cases" icon={CheckCircle2} />
        <Kpi label="Reviewed NDMAPS reports" value={completedReports} note="Separate from patient completion" icon={FileText} />
        <Kpi label="Practitioner engagement" value={retention} note="Ordered in period" icon={TrendingUp} />
        <Kpi label="Direct manufacturer orders" value={orders.length} note="Across linked accounts" icon={ShoppingCart} />
        <Kpi label="Total order value" value={money(totalOrders)} note="Fictional wholesale CAD" icon={CircleDollarSign} />
        <Kpi label="Purchasing frequency" value={`${(orders.length / Math.max(practitioners, 1)).toFixed(1)}×`} note="Orders per active ND" icon={BarChart3} />
        <Kpi label="Administration changes" value={changed} note={`${adverse} possible AE reports`} trend={adverse ? "down" : "neutral"} icon={TriangleAlert} />
      </div>
      <Panel className="grid gap-px overflow-hidden bg-[#123F52]/8 sm:grid-cols-3">
        <div className="bg-white p-4"><p className="text-[9px] font-bold uppercase tracking-wider text-[#17918B]">Patient check-in completion</p><p className="mt-2 text-sm font-bold text-[#123F52]">{completion}</p><p className="mt-1 text-[10px] text-[#71858B]">Scheduled week-{period} check-in completed / all eligible cases.</p></div>
        <div className="bg-white p-4"><p className="text-[9px] font-bold uppercase tracking-wider text-[#17918B]">Clinical follow-up completion</p><p className="mt-2 text-sm font-bold text-[#123F52]">Not available</p><p className="mt-1 text-[10px] text-[#71858B]">The seed does not include a complete assessment schedule denominator.</p></div>
        <div className="bg-white p-4"><p className="text-[9px] font-bold uppercase tracking-wider text-[#17918B]">NDMAPS reporting completion</p><p className="mt-2 text-sm font-bold text-[#123F52]">{completedReports} clinician-reviewed reports</p><p className="mt-1 text-[10px] text-[#71858B]">Separate from patient check-ins and practitioner follow-up.</p></div>
      </Panel>
      <div className="grid gap-5 xl:grid-cols-[1.45fr_.85fr]">
        <Panel className="p-5">
          <ChartTitle eyebrow="Patient-reported outcomes" title="Observed symptom trajectories" note="Hover to compare available weekly measurements" />
          <div className="mt-4 h-[320px]">
            <ResponsiveContainer width="100%" height="100%"><AreaChart data={trajectory} margin={{ left: -20, right: 12 }}>
              <defs key="overview-trajectory-defs"><linearGradient key="sleep-fill-gradient" id="sleepFillNew" x1="0" y1="0" x2="0" y2="1"><stop key="sleep-fill-start" offset="0" stopColor="#24A9A3" stopOpacity=".3" /><stop key="sleep-fill-end" offset="1" stopColor="#24A9A3" stopOpacity="0" /></linearGradient></defs>
              <CartesianGrid key="overview-trajectory-grid" stroke="#E6ECE8" vertical={false} /><XAxis key="overview-trajectory-x" dataKey="week" tick={{ fontSize: 10, fill: "#71858B" }} axisLine={false} tickLine={false} /><YAxis key="overview-trajectory-y" domain={[0, 10]} tick={{ fontSize: 10, fill: "#71858B" }} axisLine={false} tickLine={false} />
              <Tooltip key="overview-trajectory-tooltip" content={<ChartTooltip />} /><Legend key="overview-trajectory-legend" iconType="line" wrapperStyle={{ fontSize: 11 }} />
              <Area key="overview-trajectory-sleep" type="monotone" dataKey="Sleep" stroke="#159D97" strokeWidth={3} fill="url(#sleepFillNew)" />
              <Line key="overview-trajectory-anxiety" type="monotone" dataKey="Anxiety" stroke="#8C78C4" strokeWidth={2} strokeDasharray="5 4" dot={false} />
              <Line key="overview-trajectory-energy" type="monotone" dataKey="Energy" stroke="#E5A64D" strokeWidth={2} dot={false} />
            </AreaChart></ResponsiveContainer>
          </div>
          <p className="mt-2 text-[10px] text-[#74868B]">Sleep and energy: higher is better. Anxiety severity: lower is better. Missing records are not imputed.</p>
        </Panel>
        <Panel className="p-5">
          <ChartTitle eyebrow="Product exposure" title="Product use across monitored cases" note="Primary and additional exposure shown separately" />
          <div className="mt-4 h-[320px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={productUse} layout="vertical" margin={{ left: 28 }}>
            <CartesianGrid key="overview-product-grid" stroke="#E6ECE8" horizontal={false} /><XAxis key="overview-product-x" type="number" tick={{ fontSize: 10 }} axisLine={false} /><YAxis key="overview-product-y" dataKey="name" type="category" width={85} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip key="overview-product-tooltip" content={<ChartTooltip />} /><Legend key="overview-product-legend" />
            <Bar key="overview-product-cases" name="Primary-product cases" dataKey="Cases" fill="#153F50" radius={[0, 2, 2, 0]} /><Bar key="overview-product-additional" name="Additional-product exposures" dataKey="Additional" fill="#24A9A3" radius={[0, 2, 2, 0]} />
          </BarChart></ResponsiveContainer></div>
          <p className="mt-2 text-[10px] text-[#74868B]">Counts are not utilization rates or efficacy measures.</p>
        </Panel>
      </div>
      <Panel className="p-5">
        <ChartTitle eyebrow="Scheduled patient follow-up" title={`Week-${period} patient check-in completion by product`} note="Completed check-ins / all eligible monitored cases" />
        <div className="mt-4 h-[340px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={productUse} layout="vertical" margin={{ left: 36, right: 28 }}><CartesianGrid key="overview-completion-grid" stroke="#E6ECE8" horizontal={false} /><XAxis key="overview-completion-x" type="number" domain={[0,100]} unit="%" tick={{ fontSize: 10 }} axisLine={false} /><YAxis key="overview-completion-y" dataKey="name" type="category" width={90} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip key="overview-completion-tooltip" content={<CompletionTooltip week={period} />} /><Bar key="overview-completion-bar" dataKey="Completion %" fill="#A8C943" radius={[0,3,3,0]} /></BarChart></ResponsiveContainer></div>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[10px] text-[#647A81]">{productUse.map((item: AnyRecord) => <span key={item.productId}><b>{item.name}</b> {item.Completed}/{item.Eligible} ({item["Completion %"]}%)</span>)}</div>
      </Panel>
      <div className="grid gap-5 xl:grid-cols-3">
        <Panel className="p-5">
          <ChartTitle eyebrow="Network footprint" title="Participation by province" note="Click through to commercial accounts" />
          <div className="mt-4 h-[220px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={provinceData}><CartesianGrid key="overview-province-grid" stroke="#E6ECE8" vertical={false} /><XAxis key="overview-province-x" dataKey="province" tick={{ fontSize: 10 }} axisLine={false} /><YAxis key="overview-province-y" tick={{ fontSize: 10 }} axisLine={false} /><Tooltip key="overview-province-tooltip" content={<ChartTooltip />} /><Bar key="overview-province-practitioners" dataKey="Practitioners" fill="#24A9A3" /></BarChart></ResponsiveContainer></div>
          <button onClick={onNetwork} className="mt-3 flex items-center gap-2 text-xs font-bold text-[#168D88]">Open practitioner network <ChevronRight className="size-3.5" /></button>
        </Panel>
        <Panel className="p-5">
          <ChartTitle eyebrow="Commercial intelligence" title="Sales & ordering trend" note="Direct manufacturer orders" />
          <div className="mt-4 h-[220px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={monthlySales}><CartesianGrid key="overview-sales-grid" stroke="#E6ECE8" vertical={false} /><XAxis key="overview-sales-x" dataKey="month" tick={{ fontSize: 9 }} axisLine={false} /><YAxis key="overview-sales-y" tick={{ fontSize: 9 }} axisLine={false} width={42} /><Tooltip key="overview-sales-tooltip" content={<ChartTooltip />} /><Area key="overview-sales-revenue" dataKey="Revenue" stroke="#153F50" fill="#153F5020" strokeWidth={2} /></AreaChart></ResponsiveContainer></div>
        </Panel>
        <Panel className="bg-[#0D3444] p-5 text-white">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#D9F06F]">Reporting efficiency</p>
          <p className="mt-3 font-display text-3xl font-semibold">{completedReports} reports ready</p>
          <p className="mt-2 text-xs leading-relaxed text-white/52">Permission-aware case reports preserve longitudinal detail while excluding identity and non-consented records.</p>
          <div className="mt-6 space-y-3">
            {[["Possible adverse-effect records", adverse], ["Dose / timing changes", changed], ["Authorized case files", cases.length]].map(([label, value]) => <div key={String(label)} className="flex items-center justify-between border-b border-white/10 pb-3 text-xs"><span className="text-white/58">{label}</span><b className="text-[#D9F06F]">{value}</b></div>)}
          </div>
          <button onClick={onCases} className="mt-5 flex items-center gap-2 text-xs font-bold text-[#8CE1DA]">Review individual cases <ChevronRight className="size-3.5" /></button>
        </Panel>
      </div>
    </div>
  );
}

function ChartTitle({ eyebrow, title, note }: { eyebrow: string; title: string; note: string }) {
  return <div><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#17918B]">{eyebrow}</p><div className="mt-1 flex items-end justify-between gap-4"><h2 className="font-display text-xl font-semibold text-[#123F52]">{title}</h2><p className="hidden text-[10px] text-[#78898E] sm:block">{note}</p></div></div>;
}

function Outcomes({ cases, checkins, trajectory, productUse, outcomeMix, products, onCases }: AnyRecord) {
  const [domain,setDomain]=useState<"Sleep"|"Anxiety"|"Energy"|"All">("All");
  const changed = checkins.filter((item: AnyRecord) => item.reportedDoseChange).length;
  const tolerant = checkins.filter((item: AnyRecord) => !item.newOrWorsenedSymptoms).length;
  const domains = ["sleepQuality0to10", "anxietySeverity0to10", "energy0to10"].map((key) => {
    const baseline = checkins.filter((item: AnyRecord) => item.week === 0 && typeof item[key] === "number");
    const latest = checkins.filter((item: AnyRecord) => item.week >= 6 && typeof item[key] === "number");
    const avg = (rows: AnyRecord[]) => rows.length ? rows.reduce((sum, row) => sum + row[key], 0) / rows.length : 0;
    return { domain: key.startsWith("sleep") ? "Sleep" : key.startsWith("anxiety") ? "Anxiety" : "Energy", Baseline: +avg(baseline).toFixed(1), FollowUp: +avg(latest).toFixed(1) };
  });
  return (
    <div className="space-y-5">
      <Panel className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="text-[9px] font-bold uppercase tracking-wider text-[#17918B]">Patient-reported outcome domain</p><p className="mt-1 text-[10px] text-[#71858B]">{cases.length} eligible cases · missing values excluded</p></div><div className="flex bg-[#F1F5F2] p-1">{(["Sleep","Anxiety","Energy","All"] as const).map((item)=><button key={item} onClick={()=>setDomain(item)} className={`px-4 py-2 text-xs font-bold ${domain===item?"bg-[#123F52] text-white":"text-[#61777E]"}`}>{item}</button>)}</div></Panel>
      <div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
        <Panel className="p-5"><ChartTitle eyebrow="Clinical intelligence" title="Baseline vs subsequent measurement" note="Active filters applied" /><div className="mt-4 h-[310px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={domains}><CartesianGrid key="outcomes-baseline-grid" stroke="#E6ECE8" vertical={false} /><XAxis key="outcomes-baseline-x" dataKey="domain" axisLine={false} /><YAxis key="outcomes-baseline-y" domain={[0, 10]} axisLine={false} /><Tooltip key="outcomes-baseline-tooltip" content={<ChartTooltip />} /><Legend key="outcomes-baseline-legend" /><Bar key="outcomes-baseline-bar" dataKey="Baseline" fill="#153F50" /><Bar key="outcomes-followup-bar" dataKey="FollowUp" fill="#24A9A3" /></BarChart></ResponsiveContainer></div><p className="text-[10px] text-[#78898E]">Descriptive averages among available records; anxiety uses a severity scale where lower is better.</p></Panel>
        <Panel className="p-5"><ChartTitle eyebrow="Practitioner-recorded result" title="Outcome disposition" note={`${cases.length} cases`} /><div className="mt-4 h-[260px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie key="outcomes-disposition-pie" data={outcomeMix} dataKey="value" nameKey="name" innerRadius={62} outerRadius={95} paddingAngle={2} /><Tooltip key="outcomes-disposition-tooltip" content={<ChartTooltip />} /><Legend key="outcomes-disposition-legend" wrapperStyle={{ fontSize: 10 }} /></PieChart></ResponsiveContainer></div></Panel>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel className="p-5 lg:col-span-2"><ChartTitle eyebrow="Time course" title={`${domain==="All"?"Available domains":domain} over time`} note="Mean among available observations" /><div className="mt-4 h-[280px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={trajectory}><CartesianGrid key="outcomes-time-grid" stroke="#E6ECE8" vertical={false} /><XAxis key="outcomes-time-x" dataKey="week" axisLine={false} /><YAxis key="outcomes-time-y" domain={[0,10]} axisLine={false} /><Tooltip key="outcomes-time-tooltip" content={<ChartTooltip />} /><Legend key="outcomes-time-legend" />{(domain==="All"||domain==="Sleep")&&<Line key="outcomes-time-sleep" dataKey="Sleep" stroke="#159D97" strokeWidth={3} />}{(domain==="All"||domain==="Anxiety")&&<Line key="outcomes-time-anxiety" dataKey="Anxiety" stroke="#8C78C4" strokeWidth={2} />}{(domain==="All"||domain==="Energy")&&<Line key="outcomes-time-energy" dataKey="Energy" stroke="#E5A64D" strokeWidth={2} />}</LineChart></ResponsiveContainer></div><div className="mt-3 flex justify-between text-[10px] text-[#71858B]"><span>Sleep & energy: higher is better. Anxiety severity: lower is better.</span><button onClick={onCases} className="font-bold text-[#168D88]">Open authorized cases →</button></div></Panel>
        <Panel className="p-5">
          <ChartTitle eyebrow="Administration & tolerability" title="Observed signals" note="Not causal attribution" />
          <div className="mt-5 space-y-3">
            <Signal label="Reported dose / timing changes" value={changed} detail={`${percent(changed, checkins.length)} of follow-ups`} tone="amber" />
            <Signal label="No new / worsened symptom entered" value={tolerant} detail={`${percent(tolerant, checkins.length)} of follow-ups`} tone="teal" />
            <Signal label="Concurrent care documented" value={cases.filter((item: AnyRecord) => item.carePlan?.concurrentTreatments?.length || item.clinicianAssessment).length} detail="Review at case level" tone="navy" />
          </div>
        </Panel>
      </div>
      <Panel className="p-5"><ChartTitle eyebrow="Product comparison" title="Cases and scheduled completion" note="Select product above to isolate" /><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[720px] text-left text-xs"><thead><tr className="border-b text-[9px] uppercase tracking-wider text-[#72858A]"><th className="py-3">Product</th><th>Brand</th><th>Category</th><th>Primary cases</th><th>Completed / eligible</th><th>Interpretation</th></tr></thead><tbody>{productUse.map((item: AnyRecord) => { const source = products.find((p: AnyRecord) => p.name === item.name); return <tr key={item.name} className="border-b border-[#123F52]/7"><td className="py-4 font-bold text-[#123F52]">{item.name}</td><td>{source?.brand}</td><td>{source?.category}</td><td>{item.Cases}</td><td><span className="bg-[#E7F5EF] px-2 py-1 font-bold text-[#16857F]">{item.Completed}/{item.Eligible} · {item["Completion %"]}%</span></td><td className="text-[#73868B]">Operational completion; not efficacy</td></tr>; })}</tbody></table></div></Panel>
    </div>
  );
}

function Signal({ label, value, detail, tone }: { label: string; value: number; detail: string; tone: "amber" | "teal" | "navy" }) {
  const colors = tone === "amber" ? "bg-[#FFF4DD] text-[#946522]" : tone === "teal" ? "bg-[#E7F5EF] text-[#147F79]" : "bg-[#EAF1F4] text-[#123F52]";
  return <div className={`p-4 ${colors}`}><div className="flex items-center justify-between"><p className="text-xs font-bold">{label}</p><b className="font-display text-2xl">{value}</b></div><p className="mt-1 text-[10px] opacity-70">{detail}</p></div>;
}

function CaseExplorer({ cases, checkins, products, seed }: AnyRecord) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("");
  const [page, setPage] = useState(0);
  const filtered = cases.filter((item: AnyRecord) => item.id.toLowerCase().includes(search.toLowerCase()) || item.concerns.join(" ").toLowerCase().includes(search.toLowerCase()));
  const visible = filtered.slice(page * 8, page * 8 + 8);
  const item = filtered.find((record: AnyRecord) => record.id === selected) || filtered[0];
  if (!item) return <Panel className="p-10 text-center"><ShieldCheck className="mx-auto size-8 text-[#17918B]" /><h2 className="mt-3 font-display text-2xl">No permissioned cases match these filters.</h2><p className="mt-2 text-xs text-[#73868B]">Non-consented records remain inaccessible.</p></Panel>;
  const rows = checkins.filter((row: AnyRecord) => row.caseId === item.id).sort((a: AnyRecord, b: AnyRecord) => a.date.localeCompare(b.date));
  const product = products.find((record: AnyRecord) => record.productId === item.primaryProductId);
  const report = seed.reports.find((record: AnyRecord) => record.caseId === item.id);
  const events = seed.caseEvents.filter((record: AnyRecord) => record.caseId === item.id);
  const caseExport = () => downloadCsv(`${item.id}-authorized-case-report.csv`, rows.map((row: AnyRecord) => ({ caseId: item.id, week: row.week, date: row.date, sleep: row.sleepQuality0to10, anxiety: row.anxietySeverity0to10, energy: row.energy0to10, adherence: row.planAdherence, doseChangeReported: row.reportedDoseChange, possibleEffect: row.newOrWorsenedSymptoms || "" })));
  return (
    <div className="grid gap-5 xl:grid-cols-[330px_1fr]">
      <Panel className="self-start overflow-hidden">
        <div className="border-b p-4"><p className="text-[9px] font-bold uppercase tracking-wider text-[#17918B]">Permissioned records</p><div className="mt-3 flex items-center gap-2 border bg-[#F7F9F7] px-3"><Search className="size-4 text-[#71858B]" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder="Case ID or concern" className="h-10 w-full bg-transparent text-xs outline-none" /></div></div>
        <div className="p-2">{visible.map((record: AnyRecord) => <button key={record.id} onClick={() => setSelected(record.id)} className={`mb-1 w-full border-l-2 p-3 text-left transition ${item.id === record.id ? "border-[#18A29D] bg-[#EAF5F1]" : "border-transparent hover:bg-[#F5F7F4]"}`}><div className="flex justify-between"><b className="text-xs text-[#123F52]">{record.id}</b><span className="text-[9px] font-bold uppercase text-[#17918B]">{record.reviewStatus.replaceAll("_", " ")}</span></div><p className="mt-1 text-[10px] text-[#71858B]">{record.age} yrs · {record.province} · {record.concerns.join(" + ")}</p></button>)}</div>
        <div className="flex items-center justify-between border-t p-3 text-[10px] text-[#72858A]"><span>{filtered.length} cases</span><div className="flex gap-1"><button disabled={page === 0} onClick={() => setPage(page - 1)} className="border px-2 py-1 disabled:opacity-30">Prev</button><button disabled={(page + 1) * 8 >= filtered.length} onClick={() => setPage(page + 1)} className="border px-2 py-1 disabled:opacity-30">Next</button></div></div>
      </Panel>
      <div className="space-y-5">
        <Panel className="overflow-hidden">
          <div className="flex flex-col justify-between gap-4 bg-[#0D3444] p-5 text-white sm:flex-row sm:items-start">
            <div><p className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[#8CE1DA]"><ShieldCheck className="size-3.5" /> Pseudonymous authorized case</p><h2 className="mt-2 font-display text-3xl font-semibold">{item.id}</h2><p className="mt-1 text-xs text-white/50">{item.caseProgram} · baseline {item.baselineDate}</p></div>
            <div className="flex gap-2"><button onClick={caseExport} className="flex items-center gap-2 border border-white/15 px-3 py-2 text-[10px] font-bold hover:bg-white/10"><Download className="size-3.5" /> CSV</button><button onClick={() => window.print()} className="flex items-center gap-2 bg-[#D9F06F] px-3 py-2 text-[10px] font-bold text-[#123F52]"><FileText className="size-3.5" /> Case-report PDF</button></div>
          </div>
          <div className="grid grid-cols-2 gap-px bg-[#123F52]/8 md:grid-cols-4">
            {[["Patient characteristics", `${item.age} years · ${item.patientSexRecorded}`], ["Clinical context", item.concerns.join(" + ")], ["Primary product", `${product?.brand} · ${product?.name}`], ["Report status", report?.status?.replaceAll("_", " ") || "Not generated"]].map(([label, value]) => <div key={label} className="bg-white p-4"><p className="text-[9px] font-bold uppercase tracking-wider text-[#76898D]">{label}</p><p className="mt-2 text-xs font-bold capitalize text-[#123F52]">{value}</p></div>)}
          </div>
        </Panel>
        <div className="grid gap-5 2xl:grid-cols-[1fr_340px]">
          <Panel className="p-5">
            <ChartTitle eyebrow="Longitudinal record" title="Chronology of care" note={`${rows.length} follow-ups available`} />
            <div className="mt-5 max-h-[620px] overflow-y-auto pr-2">
              <TimelineEntry date={item.baselineDate} title="Baseline & practitioner plan" text={`${product?.name}, ${item.carePlan.productSchedule}. Baseline sleep ${item.baseline?.sleepQuality0to10 ?? "—"}, anxiety ${item.baseline?.anxietySeverity0to10 ?? "—"}.`} type="plan" />
              {rows.map((row: AnyRecord) => <TimelineEntry key={row.id} date={row.date} title={`Week ${row.week} patient follow-up`} text={`Sleep ${row.sleepQuality0to10 ?? "—"}/10 · anxiety ${row.anxietySeverity0to10 ?? "—"}/10 · energy ${row.energy0to10 ?? "—"}/10 · adherence ${row.planAdherence}.${row.reportedDoseChange ? ` Reported administration change: ${row.reportedDoseChange}.` : ""}${row.newOrWorsenedSymptoms ? ` Possible effect: ${row.newOrWorsenedSymptoms}.` : ""}`} type={row.newOrWorsenedSymptoms ? "alert" : "followup"} />)}
              {events.map((event: AnyRecord) => <TimelineEntry key={event.id} date={event.date} title={event.type.replaceAll("_", " ")} text={`${event.note} ${event.clinicianResponse || ""}`} type="event" />)}
            </div>
          </Panel>
          <div className="space-y-5">
            <Panel className="p-5"><ChartTitle eyebrow="Symptom trend" title="Case measures" note="Patient reported" /><div className="mt-4 h-[220px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={rows}><CartesianGrid key="case-trend-grid" stroke="#E6ECE8" vertical={false} /><XAxis key="case-trend-x" dataKey="week" tick={{ fontSize: 9 }} axisLine={false} /><YAxis key="case-trend-y" domain={[0,10]} tick={{ fontSize: 9 }} axisLine={false} /><Tooltip key="case-trend-tooltip" content={<ChartTooltip />} /><Line key="case-trend-sleep" dataKey="sleepQuality0to10" name="Sleep" stroke="#159D97" strokeWidth={2} dot={false} /><Line key="case-trend-anxiety" dataKey="anxietySeverity0to10" name="Anxiety" stroke="#8C78C4" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div></Panel>
            <Panel className="p-5"><p className="text-[9px] font-bold uppercase tracking-wider text-[#17918B]">Practitioner assessment</p><p className="mt-3 text-xs leading-relaxed text-[#4E666E]">{typeof item.clinicianAssessment === "string" ? item.clinicianAssessment : item.clinicianAssessment?.summary || "Available in signed case report."}</p><div className="mt-4 border-t pt-4"><p className="text-[9px] font-bold uppercase tracking-wider text-[#76898D]">Concurrent treatment</p><p className="mt-2 text-xs text-[#4E666E]">{item.carePlan?.concurrentTreatments?.join(", ") || "No structured concurrent treatment entry available."}</p></div></Panel>
            <div className="bg-[#FFF5DE] p-4 text-[10px] leading-relaxed text-[#775722]"><b>Privacy boundary:</b> names, contact details, raw private media, and non-permissioned records are excluded from this workspace and its exports.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineEntry({ date, title, text, type }: { date: string; title: string; text: string; type: string }) {
  const color = type === "alert" ? "bg-[#D97869]" : type === "plan" ? "bg-[#D9F06F]" : type === "event" ? "bg-[#8C78C4]" : "bg-[#24A9A3]";
  return <div className="relative grid grid-cols-[74px_1fr] gap-4 pb-6 before:absolute before:bottom-0 before:left-[82px] before:top-4 before:w-px before:bg-[#DCE6E2] last:before:hidden"><span className="pt-1 text-[10px] font-bold text-[#71858B]">{date}</span><div className="relative pl-5"><span className={`absolute left-0 top-1.5 size-2.5 -translate-x-1/2 ${color}`} /><p className="text-xs font-bold capitalize text-[#123F52]">{title}</p><p className="mt-1 text-[11px] leading-relaxed text-[#657980]">{text}</p></div></div>;
}

function Network({ practitioners, orders, seed, provinceData }: AnyRecord) {
  const [selected, setSelected] = useState("");
  const [sort, setSort] = useState("revenue");
  const accounts = practitioners.map((nd: AnyRecord) => {
    const accountOrders = orders.filter((item: AnyRecord) => item.practitionerId === nd.id);
    const revenue = accountOrders.reduce((sum: number, item: AnyRecord) => sum + item.totalCAD, 0);
    return { ...nd, accountOrders, revenue, average: accountOrders.length ? revenue / accountOrders.length : 0, last: accountOrders.map((item: AnyRecord) => item.date).sort().at(-1) || "—" };
  }).sort((a: AnyRecord, b: AnyRecord) => sort === "name" ? a.name.localeCompare(b.name) : sort === "orders" ? b.accountOrders.length - a.accountOrders.length : b.revenue - a.revenue);
  const account = accounts.find((item: AnyRecord) => item.id === selected);
  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1fr_.7fr]">
        <Panel className="p-5"><ChartTitle eyebrow="Commercial performance" title="Direct-order revenue by province" note="Fictional CAD wholesale values" /><div className="mt-4 h-[280px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={provinceData}><CartesianGrid key="network-province-grid" stroke="#E6ECE8" vertical={false} /><XAxis key="network-province-x" dataKey="province" axisLine={false} /><YAxis key="network-province-y" tick={{ fontSize: 9 }} axisLine={false} /><Tooltip key="network-province-tooltip" content={<ChartTooltip />} /><Bar key="network-province-revenue" dataKey="Revenue" fill="#153F50" /><Bar key="network-province-cases" dataKey="Cases" fill="#24A9A3" /></BarChart></ResponsiveContainer></div></Panel>
        <Panel className="p-5"><ChartTitle eyebrow="Commercial operations" title="Ordering & Fulfillment Opportunities" note="Review only; manufacturer cannot submit practitioner orders" /><div className="mt-4 space-y-2">{orders.filter((item: AnyRecord)=>["pending_approval","processing"].includes(item.status)).slice(0,4).map((order:AnyRecord)=><button key={order.id} onClick={()=>setSelected(order.practitionerId)} className={`grid w-full grid-cols-[1fr_auto] gap-3 p-3 text-left ${order.status==="pending_approval"?"bg-[#FFF7E8]":"bg-[#EEF5F7]"}`}><span><b className="block text-xs text-[#123F52]">{order.status==="pending_approval"?"Practitioner approval pending":"Order being processed"}</b><small className="text-[10px] text-[#607984]">{order.id} · {order.status==="processing"?"routine status; no delay inferred":"not submitted"}</small></span><b className="text-xs">{money(order.totalCAD)}</b></button>)}{seed.inventory.filter((item:AnyRecord)=>item.onHand<=item.reorderPoint&&practitioners.some((nd:AnyRecord)=>nd.id===item.practitionerId)).slice(0,2).map((item:AnyRecord)=>{const p=seed.products.find((x:AnyRecord)=>x.productId===item.productId);const nd=practitioners.find((x:AnyRecord)=>x.id===item.practitionerId);return <button key={`${item.practitionerId}-${item.productId}`} onClick={()=>setSelected(item.practitionerId)} className="grid w-full grid-cols-[1fr_auto] gap-3 bg-[#FFF2EF] p-3 text-left"><span><b className="block text-xs text-[#123F52]">Potentially low clinic stock · {p?.name}</b><small className="text-[10px] text-[#805D58]">{nd?.practiceName} · support opportunity only</small></span><b className="text-xs text-[#A6554B]">{item.onHand}/{item.reorderPoint}</b></button>})}</div></Panel>
      </div>
      <Panel className="overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b p-5"><ChartTitle eyebrow="Practitioner network" title="Business accounts" note="Clinical identity remains segregated" /><label className="text-[9px] font-bold uppercase tracking-wider text-[#71858B]">Sort by<select value={sort} onChange={(event) => setSort(event.target.value)} className="ml-2 border bg-white px-3 py-2 text-xs normal-case"><option value="revenue">Revenue</option><option value="orders">Order frequency</option><option value="name">Account name</option></select></label></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[920px] text-left text-xs"><thead><tr className="bg-[#F6F8F5] text-[9px] uppercase tracking-wider text-[#71858B]"><th className="p-4">Practitioner / account</th><th>Geography</th><th>Monitored</th><th>Orders</th><th>Revenue</th><th>Avg. order</th><th>Last activity</th><th>Account</th></tr></thead><tbody>{accounts.map((nd: AnyRecord) => <tr key={nd.id} className="border-t border-[#123F52]/7 hover:bg-[#F8FAF7]"><td className="p-4"><b className="text-[#123F52]">{nd.name}</b><p className="mt-1 text-[10px] text-[#71858B]">{nd.practiceName}</p></td><td>{nd.city}, {nd.province}</td><td>{nd.monitoredPatients}</td><td>{nd.accountOrders.length}</td><td className="font-bold">{money(nd.revenue)}</td><td>{money(nd.average)}</td><td>{nd.last}</td><td><button onClick={() => setSelected(nd.id)} className="font-bold text-[#168D88]">Open <ChevronRight className="inline size-3" /></button></td></tr>)}</tbody></table></div>
      </Panel>
      <Panel className="grid gap-5 p-5 lg:grid-cols-[1fr_1fr]">
        <div><p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#17918B]">Hypothetical preferred pricing</p><h2 className="mt-1 font-display text-2xl font-semibold text-[#123F52]">NDMAPS Partner Rewards</h2><p className="mt-2 max-w-xl text-xs leading-relaxed text-[#687D83]">Transparent commercial rewards based on direct-order volume and education participation—not prescribing behaviour, patient outcomes, or data-sharing decisions.</p></div>
        <div className="grid grid-cols-3 gap-2">{[["Core", "1–3 orders/qtr", "Standard pricing"], ["Plus", "4–7 orders/qtr", "3% preferred"], ["Premier", "8+ orders/qtr", "5% preferred"]].map(([name, rule, benefit]) => <div key={name} className="bg-[#F2F6F2] p-3"><b className="text-xs text-[#123F52]">{name}</b><p className="mt-2 text-[10px] text-[#6D8085]">{rule}</p><p className="mt-1 text-[10px] font-bold text-[#178F89]">{benefit}</p></div>)}</div>
      </Panel>
      {account && <AccountDrawer account={account} onClose={() => setSelected("")} />}
    </div>
  );
}

function AccountDrawer({ account, onClose }: { account: AnyRecord; onClose: () => void }) {
  return <div className="fixed inset-0 z-[70] flex justify-end bg-[#071E28]/55" onMouseDown={onClose}><aside onMouseDown={(event) => event.stopPropagation()} className="h-full w-full max-w-xl overflow-y-auto bg-[#F4F4EC] shadow-2xl"><div className="bg-[#0D3444] p-6 text-white"><div className="flex justify-between"><p className="text-[9px] font-bold uppercase tracking-wider text-[#8CE1DA]">Commercial account · no identifiable patient data</p><button onClick={onClose}><X className="size-5" /></button></div><h2 className="mt-4 font-display text-3xl font-semibold">{account.name}</h2><p className="mt-1 text-xs text-white/50">{account.practiceName} · {account.city}, {account.province}</p></div><div className="grid grid-cols-3 gap-px bg-[#123F52]/10"><MiniMetric label="Orders" value={account.accountOrders.length} /><MiniMetric label="Revenue" value={money(account.revenue)} /><MiniMetric label="Average" value={money(account.average)} /></div><div className="p-6"><h3 className="font-display text-xl font-semibold text-[#123F52]">Ordering history</h3><div className="mt-4 space-y-2">{account.accountOrders.slice().reverse().map((order: AnyRecord) => <div key={order.id} className="grid grid-cols-[1fr_auto] border bg-white p-4 text-xs"><div><b className="text-[#123F52]">{order.id}</b><p className="mt-1 text-[#71858B]">{order.date} · {order.status} · {order.source}</p></div><b>{money(order.totalCAD)}</b></div>)}</div><button onClick={() => downloadCsv(`${account.id}-commercial-summary.csv`, account.accountOrders)} className="mt-5 flex w-full items-center justify-center gap-2 bg-[#123F52] py-3 text-xs font-bold text-white"><Download className="size-4" /> Download commercial summary</button></div></aside></div>;
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return <div className="bg-white p-4 text-center"><p className="text-[9px] uppercase tracking-wider text-[#71858B]">{label}</p><b className="mt-2 block font-display text-xl text-[#123F52]">{value}</b></div>;
}

function Strategy({ productUse, provinceData, checkins, cases }: AnyRecord) {
  const timing = checkins.filter((item: AnyRecord) => item.reportedDoseChange).length;
  const possible = checkins.filter((item: AnyRecord) => item.newOrWorsenedSymptoms).length;
  const cards = [
    ["Observation", "Administration friction", `${timing} follow-ups include a patient-reported timing or frequency change. Review wording and administration guidance by product.`, "amber"],
    ["Observation", "Potential tolerability signals", `${possible} follow-ups contain a new or worsened symptom entry. These require human review and do not establish product attribution.`, "rose"],
    ["Hypothesis", "Packaging & instructions", "Cases with administration changes may help identify where timing instructions or packaging cues deserve qualitative testing.", "teal"],
    ["Opportunity", "Practitioner education", "Short clinical follow-up guides may improve consistency in adherence, concomitant-care and objective-marker documentation.", "navy"],
    ["Data gap", "Publication readiness", "Objective markers and concurrent-treatment fields are unevenly complete. A prospective observational protocol could address missingness.", "violet"],
    ["Hypothesis", "Regional acquisition", `${provinceData.sort((a: AnyRecord, b: AnyRecord) => b.Revenue - a.Revenue)[0]?.province || "Leading regions"} shows strong linked activity; compare practitioner density before prioritizing acquisition.`, "lime"],
  ];
  return <div className="space-y-5"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{cards.map(([type, title, text, tone]) => <Insight key={title} type={type} title={title} text={text} tone={tone} />)}</div><div className="grid gap-5 xl:grid-cols-[1fr_.8fr]"><Panel className="p-5"><ChartTitle eyebrow="Research opportunity map" title="Product follow-up and repeat signal" note="Hypothesis-generating only" /><div className="mt-4 h-[300px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={productUse}><CartesianGrid key="strategy-product-grid" stroke="#E6ECE8" vertical={false} /><XAxis key="strategy-product-x" dataKey="name" tick={{ fontSize: 9 }} axisLine={false} /><YAxis key="strategy-product-y" axisLine={false} /><Tooltip key="strategy-product-tooltip" content={<ChartTooltip />} /><Bar key="strategy-product-followup" dataKey="Completion %" fill="#24A9A3" /><Bar key="strategy-product-cases" dataKey="Cases" fill="#153F50" /></BarChart></ResponsiveContainer></div></Panel><Panel className="bg-[#0D3444] p-6 text-white"><Sparkles className="size-6 text-[#D9F06F]" /><p className="mt-5 text-[9px] font-bold uppercase tracking-wider text-[#8CE1DA]">Study concept · hypothesis</p><h2 className="mt-2 font-display text-3xl font-semibold">Administration timing and completion</h2><p className="mt-3 text-xs leading-relaxed text-white/55">Prospectively examine whether clearer timing instructions are associated with follow-up completion and reported adherence. Pre-specify outcomes and account for practitioner, baseline differences and concurrent treatment.</p><div className="mt-5 border-t border-white/10 pt-4 text-[10px] text-white/45"><b className="text-white/75">Status:</b> concept only · not a verified finding</div></Panel></div></div>;
}

function Insight({ type, title, text, tone }: { type: string; title: string; text: string; tone: string }) {
  const colors: Record<string, string> = { amber: "border-[#E9B65D] bg-[#FFF7E8]", rose: "border-[#D97869] bg-[#FFF2EF]", teal: "border-[#24A9A3] bg-[#EEF8F5]", navy: "border-[#153F50] bg-[#EEF2F3]", violet: "border-[#8C78C4] bg-[#F4F1FA]", lime: "border-[#A8C943] bg-[#F6F9E9]" };
  return <Panel className={`border-l-4 p-5 ${colors[tone]}`}><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#657A80]">{type}</p><h2 className="mt-2 font-display text-xl font-semibold text-[#123F52]">{title}</h2><p className="mt-3 text-xs leading-relaxed text-[#60757C]">{text}</p></Panel>;
}

function Monai({ cases, checkins, orders, products, practitioners, onCases, onExport }: AnyRecord) {
  const prompts = [
    "Which products have the highest follow-up completion rates?",
    "Show sleep trends for ZenPress cases.",
    "How many patients reported changing the timing of their supplements?",
    "Which provinces have the strongest direct-order growth?",
    "What are the most common reasons patients discontinue products?",
    "Which findings deserve further investigation?",
    "Generate an executive summary of this quarter.",
  ];
  const [input, setInput] = useState("");
  const [question, setQuestion] = useState(prompts[0]);
  const answer = useMemo(() => {
    const q = question.toLowerCase();
    if (q.includes("highest follow-up")) {
      const result = products.map((product: AnyRecord) => { const ids = cases.filter((item: AnyRecord) => item.primaryProductId === product.productId).map((item: AnyRecord) => item.id); const done = new Set(checkins.filter((row: AnyRecord) => ids.includes(row.caseId) && row.week >= 6).map((row: AnyRecord) => row.caseId)).size; return { label: product.name, value: ids.length ? Math.round(done / ids.length * 100) : 0 }; }).filter((item: AnyRecord) => item.value).sort((a: AnyRecord, b: AnyRecord) => b.value - a.value);
      return { title: "Follow-up completion by product", text: `${result[0]?.label || "No product"} has the highest completion among the active, authorized cohort at ${result[0]?.value || 0}%. This is an operational completion measure, not a clinical outcome.`, chart: result.slice(0, 6) };
    }
    if (q.includes("zenpress") || q.includes("sleep trend")) {
      const ids = new Set(cases.filter((item: AnyRecord) => products.find((p: AnyRecord) => p.productId === item.primaryProductId)?.name === "ZenPress").map((item: AnyRecord) => item.id));
      const chart = Array.from({ length: 9 }, (_, week) => { const rows = checkins.filter((item: AnyRecord) => ids.has(item.caseId) && item.week === week && typeof item.sleepQuality0to10 === "number"); return { label: `W${week}`, value: rows.length ? +(rows.reduce((sum: number, item: AnyRecord) => sum + item.sleepQuality0to10, 0) / rows.length).toFixed(1) : 0 }; });
      return { title: "ZenPress sleep-quality trend", text: `${ids.size} authorized ZenPress cases are included. The chart describes available self-reports; concurrent care, adherence, selection and missing follow-ups limit interpretation.`, chart };
    }
    if (q.includes("timing")) {
      const ids = new Set(checkins.filter((item: AnyRecord) => item.reportedDoseChange).map((item: AnyRecord) => item.caseId));
      return { title: "Patient-reported administration changes", text: `${ids.size} unique patients (${percent(ids.size, cases.length)}) reported at least one dose-timing or frequency change. These are patient reports, not confirmed practitioner-approved changes.`, chart: [{ label: "Reported change", value: ids.size }, { label: "No change recorded", value: Math.max(0, cases.length - ids.size) }] };
    }
    if (q.includes("province") || q.includes("growth")) {
      const totals: Record<string, number> = {};
      orders.forEach((order: AnyRecord) => { const nd = practitioners.find((item: AnyRecord) => item.id === order.practitionerId); if (nd) totals[nd.province] = (totals[nd.province] || 0) + order.totalCAD; });
      const chart = Object.entries(totals).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
      return { title: "Direct-order activity by province", text: `${chart[0]?.label || "No province"} has the largest direct-order value in the filtered records at ${money(chart[0]?.value || 0)}. Trend claims require a matched comparison period.`, chart };
    }
    if (q.includes("discontinue")) {
      const stopped = cases.filter((item: AnyRecord) => item.outcomeCategory === "discontinued");
      return { title: "Recorded discontinuation context", text: `${stopped.length} authorized cases are categorized as discontinued. Structured reasons are incomplete; possible-effect, administration and clinician notes should be reviewed individually before grouping reasons.`, chart: [{ label: "Discontinued", value: stopped.length }, { label: "Other disposition", value: cases.length - stopped.length }] };
    }
    if (q.includes("executive summary")) {
      const revenue = orders.reduce((sum: number, item: AnyRecord) => sum + item.totalCAD, 0);
      return { title: "Quarterly executive summary", text: `${cases.length} authorized cases contributed ${checkins.length} follow-up observations across ${new Set(cases.map((item: AnyRecord) => item.practitionerId)).size} practitioners. ${orders.length} direct orders totalled ${money(revenue)} in fictional wholesale value. Priority operational questions are follow-up completeness, administration changes and reporting consistency. No causal efficacy conclusion is supported.`, chart: [{ label: "Cases", value: cases.length }, { label: "Follow-ups", value: checkins.length }, { label: "Orders", value: orders.length }] };
    }
    const adverse = checkins.filter((item: AnyRecord) => item.newOrWorsenedSymptoms).length;
    return { title: "Investigation priorities", text: `${adverse} follow-ups include a possible adverse-effect entry. Other priorities are product-level missingness, administration changes, concurrent treatments and variation between practices. These are hypotheses for human review, not verified findings.`, chart: [{ label: "Possible-effect entries", value: adverse }, { label: "Dose/timing changes", value: checkins.filter((item: AnyRecord) => item.reportedDoseChange).length }] };
  }, [question, cases, checkins, orders, products, practitioners]);
  const ask = () => { if (input.trim()) { setQuestion(input.trim()); setInput(""); } };
  return <div className="grid gap-5 xl:grid-cols-[1fr_360px]"><Panel className="overflow-hidden"><div className="bg-[#0D3444] p-6 text-white"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center bg-[#D9F06F] text-[#123F52]"><Sparkles className="size-5" /></span><div><p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#8CE1DA]">Deterministic local analyst</p><h2 className="font-display text-2xl font-semibold">Ask Monai™</h2></div></div><p className="mt-4 max-w-2xl text-xs leading-relaxed text-white/52">Answers are calculated from the active, authorized local dataset. No live AI, ERP or production system connection is represented.</p></div><div className="p-5"><p className="text-[9px] font-bold uppercase tracking-wider text-[#71858B]">Your question</p><div className="mt-2 flex border border-[#123F52]/12 bg-[#F8FAF8] p-1"><input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => event.key === "Enter" && ask()} placeholder="Ask about outcomes, operations or reporting…" className="h-11 flex-1 bg-transparent px-3 text-xs outline-none" /><button onClick={ask} className="bg-[#123F52] px-5 text-xs font-bold text-white">Analyze</button></div><div className="mt-6 border-l-2 border-[#24A9A3] pl-5"><p className="text-[9px] font-bold uppercase tracking-wider text-[#17918B]">Grounded answer · active filters</p><h3 className="mt-2 font-display text-2xl font-semibold text-[#123F52]">{answer.title}</h3><p className="mt-3 text-sm leading-relaxed text-[#536B73]">{answer.text}</p></div><div className="mt-5 h-[270px] bg-[#F7F9F6] p-3"><ResponsiveContainer width="100%" height="100%"><BarChart data={answer.chart}><CartesianGrid key="monai-answer-grid" stroke="#E1E9E5" vertical={false} /><XAxis key="monai-answer-x" dataKey="label" tick={{ fontSize: 9 }} axisLine={false} /><YAxis key="monai-answer-y" tick={{ fontSize: 9 }} axisLine={false} /><Tooltip key="monai-answer-tooltip" content={<ChartTooltip />} /><Bar key="monai-answer-value" dataKey="value" fill="#24A9A3" radius={[2,2,0,0]} /></BarChart></ResponsiveContainer></div><div className="mt-4 flex gap-2"><button onClick={onCases} className="border px-3 py-2 text-[10px] font-bold text-[#123F52]">Drill into cases</button><button onClick={onExport} className="border px-3 py-2 text-[10px] font-bold text-[#123F52]">Export result cohort</button></div></div></Panel><Panel className="self-start p-5"><p className="text-[9px] font-bold uppercase tracking-[.15em] text-[#17918B]">Suggested questions</p><div className="mt-4 space-y-2">{prompts.map((prompt) => <button key={prompt} onClick={() => setQuestion(prompt)} className={`w-full border-l-2 p-3 text-left text-xs leading-relaxed transition ${question === prompt ? "border-[#24A9A3] bg-[#EAF5F1] font-bold text-[#123F52]" : "border-[#DDE6E2] bg-[#F8FAF8] text-[#62777E] hover:border-[#24A9A3]"}`}>{prompt}</button>)}</div><div className="mt-5 bg-[#FFF5DE] p-4 text-[10px] leading-relaxed text-[#775722]"><b>Interpretation guardrail:</b> Monai labels observations and hypotheses, and does not convert associations into efficacy claims.</div></Panel></div>;
}
