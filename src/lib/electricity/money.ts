export type RoundingMode = "exact" | "w50" | "w100";

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export function normalizeNumeric(input: string): string {
  return input
    .trim()
    .replace(/[٠-٩]/g, (digit) => String(ARABIC_DIGITS.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(PERSIAN_DIGITS.indexOf(digit)))
    .replace(/٫/g, ".")
    .replace(/,/g, ".")
    .replace(/\s+/g, "");
}

export type ParsedNumber =
  | { kind: "empty" }
  | { kind: "partial" }
  | { kind: "invalid" }
  | { kind: "ok"; value: number };

export function parseNumber(input: string): ParsedNumber {
  const text = normalizeNumeric(input);
  if (!text) return { kind: "empty" };
  if (text === "." || /^\d+\.$/.test(text)) return { kind: "partial" };
  if (!/^\d+(\.\d+)?$/.test(text)) return { kind: "invalid" };
  const value = Number(text);
  if (!Number.isFinite(value) || value > 100_000_000) return { kind: "invalid" };
  return { kind: "ok", value };
}

/** Snap a meter reading to watt precision (3 decimal kWh). */
export function snapReading(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function toWatts(reading: number): number {
  return Math.round(reading * 1000);
}

export function kwhFromWatts(watts: number): number {
  return Math.round(watts) / 1000;
}

export function roundWatts(watts: number, mode: RoundingMode): number {
  if (mode === "exact" || watts === 0) return watts;
  const step = mode === "w50" ? 50 : 100;
  return Math.round(watts / step) * step;
}

/** Ceiling to a whole shekel. Exact integers are unchanged. */
export function ceilShekel(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  const micro = Math.round(amount * 1_000_000);
  const negative = micro < 0;
  const abs = Math.abs(micro);
  const whole = Math.floor(abs / 1_000_000);
  const frac = abs % 1_000_000;
  const ceiled = frac === 0 ? whole : whole + 1;
  return negative ? -ceiled : ceiled;
}

export function costFromWatts(watts: number, pricePerKwh: number): number {
  return ceilShekel((watts / 1000) * pricePerKwh);
}

export function formatReading(value: number): string {
  return snapReading(value).toFixed(3);
}

/** Consumption as people say it: watts under 1 kWh, otherwise trimmed kWh. */
export function formatConsumption(watts: number): string {
  const rounded = Math.round(watts);
  if (Math.abs(rounded) < 1000) return `${rounded} واط`;
  const text = (rounded / 1000).toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
  return `${text} كيلو`;
}

export function formatTableKwh(watts: number, mode: RoundingMode): string {
  const digits = mode === "exact" ? 3 : 2;
  return (Math.round(watts) / 1000).toFixed(digits);
}

export function formatTotalKwh(watts: number): string {
  const text = (Math.round(watts) / 1000)
    .toFixed(3)
    .replace(/0+$/, "")
    .replace(/\.$/, "");
  return `${text || "0"} كيلو`;
}

export function formatMoney(cost: number): string {
  return `${cost} شيكل`;
}

export function formatPrice(price: number): string {
  const text = price.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
  return text || "0";
}

export function roundingLabel(mode: RoundingMode): string {
  if (mode === "exact") return "قراءة دقيقة";
  if (mode === "w50") return "أقرب 50 واط";
  return "أقرب 100 واط";
}

/** Largest-remainder split so shares add up to the adopted watts. */
export function splitWatts(totalWatts: number, percents: number[]): number[] {
  const count = percents.length;
  if (count === 0) return [];
  const total = Math.round(totalWatts);
  const exact = percents.map((percent) => (total * percent) / 100);
  const base = exact.map((value) => Math.floor(value + 1e-9));
  let leftover = total - base.reduce((sum, value) => sum + value, 0);
  const order = exact
    .map((value, index) => ({ index, frac: value - Math.floor(value + 1e-9) }))
    .sort((a, b) => b.frac - a.frac || a.index - b.index);

  if (leftover > 0) {
    let cursor = 0;
    while (leftover > 0) {
      base[order[cursor % order.length]!.index] += 1;
      leftover -= 1;
      cursor += 1;
    }
  } else if (leftover < 0) {
    const reverse = [...order].reverse();
    for (const item of reverse) {
      while (leftover < 0 && base[item.index]! > 0) {
        base[item.index] -= 1;
        leftover += 1;
      }
      if (leftover >= 0) break;
    }
  }
  return base;
}
