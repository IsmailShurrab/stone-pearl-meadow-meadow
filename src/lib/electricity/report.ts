import type { Evaluation, Invoice, Ledger } from "./model.ts";
import {
  formatConsumption,
  formatPrice,
  formatReading,
  formatTotalKwh,
  roundingLabel,
  toWatts,
} from "./money.ts";

export function formatArabicDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("ar", {
    day: "numeric",
    month: "long",
    year: "numeric",
    numberingSystem: "latn",
  }).format(date);
}

type ReportSplit = { name: string; watts: number };
type ReportPerson = { name: string; watts: number; cost: number };
type ReportBlock = {
  title: string;
  previous: number;
  current: number;
  adoptedWatts: number;
  cost: number | null;
  splits: ReportSplit[];
  people: ReportPerson[];
  shared: boolean;
};

function render(options: {
  dateLabel: string;
  price: number;
  rounding: Ledger["settings"]["rounding"];
  draft: boolean;
  blocks: ReportBlock[];
  totalWatts: number;
  totalCost: number;
}): string {
  const lines: string[] = ["فاتورة الكهرباء", options.dateLabel];
  if (options.draft) lines.push("مسودة — لم تُحفظ كفاتورة بعد");
  lines.push(
    `سعر الكيلو: ${formatPrice(options.price)} شيكل`,
    `التقريب: ${roundingLabel(options.rounding)}`,
    "",
  );

  options.blocks.forEach((block, index) => {
    if (index > 0) lines.push("");
    const prefix = block.shared ? `عداد ${block.title}` : block.title;
    lines.push(
      `${prefix} سابق: ${formatReading(block.previous)} كيلو`,
      `${prefix} حاليا: ${formatReading(block.current)} كيلو`,
      `الاستهلاك: ${formatConsumption(block.adoptedWatts)}`,
    );
    for (const split of block.splits) {
      lines.push(`تكلفة ${split.name}: ${formatConsumption(split.watts)}`);
    }
    for (const person of block.people) {
      lines.push(`${person.name}: ${formatConsumption(person.watts)} — ${person.cost} شيكل`);
    }
    if (block.cost !== null) lines.push(`الإجمالي: ${block.cost} شيكل`);
  });

  lines.push(
    "",
    `المجموع: ${formatTotalKwh(options.totalWatts)}`,
    `المبلغ: ${options.totalCost} شيكل`,
  );
  return lines.join("\n");
}

export function reportFromInvoice(invoice: Invoice): string {
  const blocks: ReportBlock[] = [
    ...invoice.subscribers.map((subscriber) => ({
      title: subscriber.name,
      previous: subscriber.previous,
      current: subscriber.current,
      adoptedWatts: toWatts(subscriber.adoptedKwh),
      cost: subscriber.cost,
      splits: subscriber.splits.map((split) => ({
        name: split.name,
        watts: toWatts(split.kwh),
      })),
      people: [],
      shared: false,
    })),
    ...invoice.sharedMeters.map((meter) => ({
      title: meter.name,
      previous: meter.previous,
      current: meter.current,
      adoptedWatts: toWatts(meter.adoptedKwh),
      cost: meter.cost,
      splits: [],
      people: meter.allocations.map((allocation) => ({
        name: allocation.name,
        watts: toWatts(allocation.kwh),
        cost: allocation.cost,
      })),
      shared: true,
    })),
  ];
  return render({
    dateLabel: formatArabicDate(invoice.createdAt),
    price: invoice.pricePerKwh,
    rounding: invoice.rounding,
    draft: false,
    blocks,
    totalWatts: toWatts(invoice.totalKwh),
    totalCost: invoice.totalCost,
  });
}

export function reportFromLedger(ledger: Ledger, view: Evaluation, now = new Date()): string {
  const blocks: ReportBlock[] = [];
  view.subscribers.forEach((subscriber) => {
    if (
      subscriber.issue ||
      !subscriber.name ||
      subscriber.previous === null ||
      subscriber.current === null ||
      subscriber.adoptedWatts === null ||
      subscriber.cost === null
    ) {
      return;
    }
    blocks.push({
      title: subscriber.name,
      previous: subscriber.previous,
      current: subscriber.current,
      adoptedWatts: subscriber.adoptedWatts,
      cost: subscriber.cost,
      splits: subscriber.splits,
      people: [],
      shared: false,
    });
  });
  view.shared.forEach((meter) => {
    if (
      meter.issue ||
      !meter.name ||
      meter.previous === null ||
      meter.current === null ||
      meter.adoptedWatts === null ||
      meter.cost === null
    ) {
      return;
    }
    blocks.push({
      title: meter.name,
      previous: meter.previous,
      current: meter.current,
      adoptedWatts: meter.adoptedWatts,
      cost: meter.cost,
      splits: [],
      people: meter.allocations.flatMap((allocation) =>
        allocation.watts === null || allocation.cost === null || !allocation.name
          ? []
          : [{ name: allocation.name, watts: allocation.watts, cost: allocation.cost }],
      ),
      shared: true,
    });
  });
  return render({
    dateLabel: formatArabicDate(now.toISOString()),
    price: ledger.settings.pricePerKwh,
    rounding: ledger.settings.rounding,
    draft: !view.canClose,
    blocks,
    totalWatts: view.totalWatts,
    totalCost: view.totalCost,
  });
}
