import { z } from "zod";
import {
  costFromWatts,
  formatReading,
  kwhFromWatts,
  parseNumber,
  roundWatts,
  snapReading,
  splitWatts,
  toWatts,
  type RoundingMode,
} from "./money.ts";

const nonNeg = z.number().min(0);
const intNonNeg = z.number().int().min(0);

export const roundingSchema = z.enum(["exact", "w50", "w100"]);

export const splitSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  kwh: z.string(),
});

export const subscriberSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  previous: z.string(),
  current: z.string(),
  splits: z.array(splitSchema).max(30),
});

export const allocationSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  percent: z.string(),
});

export const sharedMeterSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  previous: z.string(),
  current: z.string(),
  allocations: z.array(allocationSchema).max(30),
});

export const invoiceSubscriberSchema = z.object({
  name: z.string(),
  previous: nonNeg,
  current: nonNeg,
  rawKwh: nonNeg,
  adoptedKwh: nonNeg,
  cost: intNonNeg,
  splits: z.array(z.object({ name: z.string(), kwh: nonNeg })).max(30),
});

export const invoiceSharedSchema = z.object({
  name: z.string(),
  previous: nonNeg,
  current: nonNeg,
  rawKwh: nonNeg,
  adoptedKwh: nonNeg,
  cost: intNonNeg,
  allocations: z
    .array(
      z.object({
        name: z.string(),
        percent: nonNeg,
        kwh: nonNeg,
        cost: intNonNeg,
      }),
    )
    .max(30),
});

export const invoiceSchema = z.object({
  id: z.string().min(1),
  createdAt: z.string().min(1),
  pricePerKwh: z.number().positive(),
  rounding: roundingSchema,
  subscribers: z.array(invoiceSubscriberSchema).max(200),
  sharedMeters: z.array(invoiceSharedSchema).max(50),
  totalKwh: nonNeg,
  totalCost: intNonNeg,
});

export const ledgerSchema = z.object({
  version: z.literal(1),
  settings: z.object({
    pricePerKwh: z.number().positive().max(1_000_000),
    rounding: roundingSchema,
  }),
  subscribers: z.array(subscriberSchema).max(200),
  sharedMeters: z.array(sharedMeterSchema).max(50),
  history: z.array(invoiceSchema).max(500),
});

export type Ledger = z.infer<typeof ledgerSchema>;
export type Subscriber = z.infer<typeof subscriberSchema>;
export type SharedMeter = z.infer<typeof sharedMeterSchema>;
export type SplitLine = z.infer<typeof splitSchema>;
export type Allocation = z.infer<typeof allocationSchema>;
export type Invoice = z.infer<typeof invoiceSchema>;

export type ReadingIssue =
  | "need-both"
  | "need-previous"
  | "need-current"
  | "partial"
  | "invalid"
  | "decreased";

export type ParsedSplit = { name: string; watts: number };

export type SubscriberEval = {
  id: string;
  name: string;
  issue: ReadingIssue | null;
  previous: number | null;
  current: number | null;
  rawWatts: number | null;
  adoptedWatts: number | null;
  cost: number | null;
  splits: ParsedSplit[];
  splitWarning: string | null;
};

export type AllocationEval = {
  id: string;
  name: string;
  percent: number | null;
  watts: number | null;
  cost: number | null;
};

export type SharedEval = {
  id: string;
  name: string;
  issue: ReadingIssue | null;
  previous: number | null;
  current: number | null;
  rawWatts: number | null;
  adoptedWatts: number | null;
  allocations: AllocationEval[];
  cost: number | null;
};

export type Evaluation = {
  subscribers: SubscriberEval[];
  shared: SharedEval[];
  totalWatts: number;
  totalCost: number;
  canClose: boolean;
  issues: string[];
};

export function uid(): string {
  return crypto.randomUUID();
}

export function sampleLedger(): Ledger {
  return {
    version: 1,
    settings: { pricePerKwh: 35, rounding: "w50" },
    subscribers: [
      {
        id: "sub-abdo",
        name: "عبدو",
        previous: "46671.900",
        current: "46673.800",
        splits: [],
      },
      {
        id: "sub-moh",
        name: "محمد",
        previous: "3089.200",
        current: "3092.300",
        splits: [
          { id: "sp-ismail", name: "إسماعيل", kwh: "2.6" },
          { id: "sp-hawzi", name: "حوزي", kwh: "0.5" },
        ],
      },
      {
        id: "sub-khalil",
        name: "خليل",
        previous: "4959.661",
        current: "4960.353",
        splits: [],
      },
      {
        id: "sub-anas",
        name: "أبو أنس",
        previous: "80.260",
        current: "81",
        splits: [],
      },
    ],
    sharedMeters: [],
    history: [],
  };
}

export function emptyLedger(): Ledger {
  return {
    version: 1,
    settings: { pricePerKwh: 35, rounding: "w50" },
    subscribers: [],
    sharedMeters: [],
    history: [],
  };
}

export function blankSubscriber(): Subscriber {
  return { id: uid(), name: "", previous: "", current: "", splits: [] };
}

export function blankSplit(): SplitLine {
  return { id: uid(), name: "", kwh: "" };
}

export function blankSharedMeter(): SharedMeter {
  return {
    id: uid(),
    name: "",
    previous: "",
    current: "",
    allocations: [blankAllocation("50"), blankAllocation("50")],
  };
}

export function blankAllocation(percent = ""): Allocation {
  return { id: uid(), name: "", percent };
}

export function equalPercentStrings(count: number): string[] {
  if (count <= 0) return [];
  const base = Math.floor(10000 / count) / 100;
  const values = Array.from({ length: count }, () => base);
  const assigned = Math.round(base * (count - 1) * 100) / 100;
  values[count - 1] = Math.round((100 - assigned) * 100) / 100;
  return values.map((value) => String(Math.round(value * 100) / 100));
}

export function readingIssueLabel(issue: ReadingIssue): string {
  switch (issue) {
    case "need-both":
      return "أدخل القراءتين";
    case "need-previous":
      return "أدخل القراءة السابقة";
    case "need-current":
      return "أدخل القراءة الحالية";
    case "partial":
      return "أكمل الرقم";
    case "invalid":
      return "رقم غير صالح";
    case "decreased":
      return "الحالية أصغر من السابقة";
  }
}

type ReadingsOk = {
  issue: null;
  previous: number;
  current: number;
  rawWatts: number;
};

type ReadingsBad = { issue: ReadingIssue };

function classifyReadings(previous: string, current: string): ReadingsOk | ReadingsBad {
  const prev = parseNumber(previous);
  const curr = parseNumber(current);
  if (prev.kind === "invalid" || curr.kind === "invalid") return { issue: "invalid" };
  if (prev.kind === "partial" || curr.kind === "partial") return { issue: "partial" };
  if (prev.kind === "empty" && curr.kind === "empty") return { issue: "need-both" };
  if (prev.kind === "empty") return { issue: "need-previous" };
  if (curr.kind === "empty") return { issue: "need-current" };
  const prevWatts = toWatts(prev.value);
  const currWatts = toWatts(curr.value);
  if (currWatts < prevWatts) return { issue: "decreased" };
  return {
    issue: null,
    previous: snapReading(prev.value),
    current: snapReading(curr.value),
    rawWatts: currWatts - prevWatts,
  };
}

function parsePercent(input: string): number | null {
  const parsed = parseNumber(input);
  if (parsed.kind !== "ok") return null;
  if (parsed.value < 0 || parsed.value > 100) return null;
  return Math.round(parsed.value * 100) / 100;
}

function readingMessage(name: string, issue: ReadingIssue, kind: "مشترك" | "عداد"): string {
  const who = name || (kind === "مشترك" ? "مشترك بلا اسم" : "عداد بلا اسم");
  switch (issue) {
    case "need-both":
    case "need-previous":
    case "need-current":
      return `أكمل قراءة ${who}`;
    case "partial":
      return `أكمل الرقم في قراءة ${who}`;
    case "invalid":
      return `قراءة ${who} غير صالحة`;
    case "decreased":
      return `القراءة الحالية لـ ${who} أصغر من السابقة`;
  }
}

function evalSplits(splits: SplitLine[]): { issues: string[]; ok: ParsedSplit[] } {
  const issues: string[] = [];
  const ok: ParsedSplit[] = [];
  splits.forEach((split, index) => {
    const name = split.name.trim();
    const amount = split.kwh.trim();
    if (!name && !amount) return;
    if (!name) {
      issues.push(`أدخل اسم الشخص في بند التوزيع ${index + 1}`);
      return;
    }
    const parsed = parseNumber(split.kwh);
    if (parsed.kind !== "ok") {
      issues.push(`كمية توزيع ${name} غير صالحة`);
      return;
    }
    ok.push({ name, watts: toWatts(parsed.value) });
  });
  return { issues, ok };
}

export function evaluate(ledger: Ledger): Evaluation {
  const { pricePerKwh, rounding } = ledger.settings;
  const issues: string[] = [];
  let totalWatts = 0;
  let totalCost = 0;

  const subscribers: SubscriberEval[] = ledger.subscribers.map((subscriber) => {
    const name = subscriber.name.trim();
    const readings = classifyReadings(subscriber.previous, subscriber.current);
    const splitEval = evalSplits(subscriber.splits);
    issues.push(...splitEval.issues);
    if (!name) issues.push("أدخل اسم كل مشترك");
    if (readings.issue) issues.push(readingMessage(name, readings.issue, "مشترك"));

    const adoptedWatts = readings.issue ? null : roundWatts(readings.rawWatts, rounding);
    const cost = adoptedWatts === null ? null : costFromWatts(adoptedWatts, pricePerKwh);
    let splitWarning: string | null = null;
    if (adoptedWatts !== null && splitEval.ok.length > 0) {
      const splitSum = splitEval.ok.reduce((sum, split) => sum + split.watts, 0);
      if (splitSum !== adoptedWatts) splitWarning = "مجموع التوزيع لا يساوي الاستهلاك المعتمد";
    }
    if (readings.issue === null && adoptedWatts !== null && cost !== null) {
      totalWatts += adoptedWatts;
      totalCost += cost;
    }
    return {
      id: subscriber.id,
      name,
      issue: readings.issue,
      previous: readings.issue ? null : readings.previous,
      current: readings.issue ? null : readings.current,
      rawWatts: readings.issue ? null : readings.rawWatts,
      adoptedWatts,
      cost,
      splits: splitEval.ok,
      splitWarning,
    };
  });

  const shared: SharedEval[] = ledger.sharedMeters.map((meter) => {
    const name = meter.name.trim();
    const readings = classifyReadings(meter.previous, meter.current);
    if (!name) issues.push("أدخل اسم العداد المشترك");
    if (readings.issue) issues.push(readingMessage(name, readings.issue, "عداد"));

    const adoptedWatts = readings.issue ? null : roundWatts(readings.rawWatts, rounding);
    let percentsOk = meter.allocations.length > 0;
    if (meter.allocations.length === 0) {
      issues.push(`أضف أشخاصاً على العداد ${name || "المشترك"}`);
    }
    const parsedPercents: Array<number | null> = [];
    for (const allocation of meter.allocations) {
      const person = allocation.name.trim();
      const percent = parsePercent(allocation.percent);
      if (!person) {
        percentsOk = false;
        issues.push(`أدخل اسم كل شخص في عداد ${name || "مشترك"}`);
      }
      if (percent === null) {
        percentsOk = false;
        issues.push(`نسبة ${person || "أحد الأشخاص"} في عداد ${name || "مشترك"} غير صالحة`);
      }
      parsedPercents.push(percent);
    }
    const percentValues = parsedPercents.filter((value): value is number => value !== null);
    const percentSum =
      percentsOk && percentValues.length === meter.allocations.length
        ? Math.round(percentValues.reduce((sum, value) => sum + value, 0) * 100) / 100
        : null;
    if (percentSum !== null && percentSum !== 100) {
      percentsOk = false;
      issues.push(`نسب عداد ${name || "مشترك"} مجموعها ${percentSum}٪ ويجب أن تساوي 100٪`);
    }

    let allocations: AllocationEval[] = meter.allocations.map((allocation, index) => ({
      id: allocation.id,
      name: allocation.name.trim(),
      percent: parsedPercents[index] ?? null,
      watts: null,
      cost: null,
    }));
    let cost: number | null = null;
    if (adoptedWatts !== null && percentsOk && percentSum === 100) {
      const shares = splitWatts(
        adoptedWatts,
        allocations.map((allocation) => allocation.percent ?? 0),
      );
      allocations = allocations.map((allocation, index) => {
        const watts = shares[index] ?? 0;
        return {
          ...allocation,
          watts,
          cost: costFromWatts(watts, pricePerKwh),
        };
      });
      cost = allocations.reduce((sum, allocation) => sum + (allocation.cost ?? 0), 0);
    }

    const ready =
      readings.issue === null &&
      Boolean(name) &&
      percentsOk &&
      percentSum === 100 &&
      adoptedWatts !== null &&
      cost !== null &&
      allocations.every((allocation) => allocation.name && allocation.cost !== null);
    if (ready && adoptedWatts !== null && cost !== null) {
      totalWatts += adoptedWatts;
      totalCost += cost;
    }

    return {
      id: meter.id,
      name,
      issue: readings.issue,
      previous: readings.issue ? null : readings.previous,
      current: readings.issue ? null : readings.current,
      rawWatts: readings.issue ? null : readings.rawWatts,
      adoptedWatts,
      allocations,
      cost: ready ? cost : null,
    };
  });

  if (ledger.subscribers.length === 0 && ledger.sharedMeters.length === 0) {
    issues.unshift("أضف مشتركاً أو عداداً مشتركاً أولاً");
  }

  const uniqueIssues = [...new Set(issues)];
  return {
    subscribers,
    shared,
    totalWatts,
    totalCost,
    canClose: uniqueIssues.length === 0,
    issues: uniqueIssues,
  };
}

export type CloseResult =
  | { ok: true; ledger: Ledger; invoice: Invoice }
  | { ok: false; message: string };

function committedReading(input: string): string {
  const parsed = parseNumber(input);
  if (parsed.kind !== "ok") return formatReading(0);
  return formatReading(parsed.value);
}

export function closeWeek(ledger: Ledger, now = new Date()): CloseResult {
  const view = evaluate(ledger);
  if (!view.canClose) {
    return { ok: false, message: view.issues[0] ?? "لا يمكن إنشاء الفاتورة" };
  }

  const invoice: Invoice = {
    id: uid(),
    createdAt: now.toISOString(),
    pricePerKwh: ledger.settings.pricePerKwh,
    rounding: ledger.settings.rounding,
    subscribers: view.subscribers.map((subscriber) => ({
      name: subscriber.name,
      previous: subscriber.previous ?? 0,
      current: subscriber.current ?? 0,
      rawKwh: kwhFromWatts(subscriber.rawWatts ?? 0),
      adoptedKwh: kwhFromWatts(subscriber.adoptedWatts ?? 0),
      cost: subscriber.cost ?? 0,
      splits: subscriber.splits.map((split) => ({
        name: split.name,
        kwh: kwhFromWatts(split.watts),
      })),
    })),
    sharedMeters: view.shared.map((meter) => ({
      name: meter.name,
      previous: meter.previous ?? 0,
      current: meter.current ?? 0,
      rawKwh: kwhFromWatts(meter.rawWatts ?? 0),
      adoptedKwh: kwhFromWatts(meter.adoptedWatts ?? 0),
      cost: meter.cost ?? 0,
      allocations: meter.allocations.map((allocation) => ({
        name: allocation.name,
        percent: allocation.percent ?? 0,
        kwh: kwhFromWatts(allocation.watts ?? 0),
        cost: allocation.cost ?? 0,
      })),
    })),
    totalKwh: kwhFromWatts(view.totalWatts),
    totalCost: view.totalCost,
  };

  const next: Ledger = {
    version: 1,
    settings: {
      pricePerKwh: ledger.settings.pricePerKwh,
      rounding: ledger.settings.rounding satisfies RoundingMode,
    },
    subscribers: ledger.subscribers.map((subscriber) => ({
      id: subscriber.id,
      name: subscriber.name,
      previous: committedReading(subscriber.current),
      current: "",
      splits: subscriber.splits
        .filter((split) => split.name.trim() || split.kwh.trim())
        .map((split) => ({ ...split, kwh: "" })),
    })),
    sharedMeters: ledger.sharedMeters.map((meter) => ({
      ...meter,
      previous: committedReading(meter.current),
      current: "",
      allocations: meter.allocations.map((allocation) => ({ ...allocation })),
    })),
    history: [structuredClone(invoice), ...ledger.history.map((item) => structuredClone(item))],
  };

  const checked = ledgerSchema.safeParse(next);
  if (!checked.success) {
    return { ok: false, message: "تعذر تجهيز الفاتورة للحفظ." };
  }
  return { ok: true, ledger: checked.data, invoice: checked.data.history[0]! };
}
