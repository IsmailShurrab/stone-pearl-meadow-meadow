import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ceilShekel,
  costFromWatts,
  parseNumber,
  roundWatts,
  splitWatts,
} from "./money.ts";
import { closeWeek, emptyLedger, evaluate, sampleLedger, type Ledger } from "./model.ts";
import { reportFromInvoice } from "./report.ts";
import {
  LEDGER_KEY,
  LEDGER_TMP_KEY,
  loadLedger,
  parseLedgerJson,
  saveLedger,
  serializeLedger,
  type Kv,
} from "./storage.ts";

function memoryKv(initial?: Record<string, string>): Kv & { dump: Map<string, string> } {
  const dump = new Map(Object.entries(initial ?? {}));
  return {
    dump,
    getItem: (key) => dump.get(key) ?? null,
    setItem: (key, value) => dump.set(key, value),
    removeItem: (key) => {
      dump.delete(key);
    },
  };
}

describe("electricity money", () => {
  it("rounds the published week to the nearest 50 watts and ceilings each bill", () => {
    const view = evaluate(sampleLedger());
    const byName = Object.fromEntries(view.subscribers.map((row) => [row.name, row]));
    assert.equal(byName["عبدو"]?.adoptedWatts, 1900);
    assert.equal(byName["عبدو"]?.cost, 67);
    assert.equal(byName["محمد"]?.adoptedWatts, 3100);
    assert.equal(byName["محمد"]?.cost, 109);
    assert.equal(byName["خليل"]?.rawWatts, 692);
    assert.equal(byName["خليل"]?.adoptedWatts, 700);
    assert.equal(byName["خليل"]?.cost, 25);
    assert.equal(byName["أبو أنس"]?.rawWatts, 740);
    assert.equal(byName["أبو أنس"]?.adoptedWatts, 750);
    assert.equal(byName["أبو أنس"]?.cost, 27);
    assert.equal(view.totalWatts, 6450);
    assert.equal(view.totalCost, 228);
    assert.equal(view.canClose, true);
  });

  it("does not add informational splits on top of the subscriber bill", () => {
    const moh = evaluate(sampleLedger()).subscribers.find((row) => row.name === "محمد");
    assert.deepEqual(
      moh?.splits.map((split) => split.watts),
      [2600, 500],
    );
    assert.equal(moh?.cost, 109);
    assert.equal(moh?.splitWarning, null);
  });

  it("uses exact watts or the nearest 100 watts when requested", () => {
    const ledger = sampleLedger();
    ledger.settings.rounding = "exact";
    const exact = evaluate(ledger);
    assert.equal(exact.subscribers.find((row) => row.name === "خليل")?.adoptedWatts, 692);
    assert.equal(exact.subscribers.find((row) => row.name === "خليل")?.cost, 25);
    assert.equal(exact.subscribers.find((row) => row.name === "أبو أنس")?.adoptedWatts, 740);
    assert.equal(exact.subscribers.find((row) => row.name === "أبو أنس")?.cost, 26);

    ledger.settings.rounding = "w100";
    const hundred = evaluate(ledger);
    assert.equal(hundred.subscribers.find((row) => row.name === "خليل")?.adoptedWatts, 700);
    assert.equal(hundred.subscribers.find((row) => row.name === "أبو أنس")?.adoptedWatts, 700);
  });

  it("ceilings exact shekels without bumping them", () => {
    assert.equal(ceilShekel(70), 70);
    assert.equal(ceilShekel(66.5), 67);
    assert.equal(ceilShekel(24.5), 25);
    assert.equal(ceilShekel(26.25), 27);
    assert.equal(ceilShekel(0), 0);
    assert.equal(costFromWatts(2000, 35), 70);
    assert.equal(roundWatts(725, "w50"), 750);
    assert.equal(roundWatts(725, "w100"), 700);
  });

  it("parses Arabic-Indic digits and rejects bad input", () => {
    assert.deepEqual(parseNumber("١٢٫٥"), { kind: "ok", value: 12.5 });
    assert.deepEqual(parseNumber("1,25"), { kind: "ok", value: 1.25 });
    assert.equal(parseNumber("").kind, "empty");
    assert.equal(parseNumber("12.").kind, "partial");
    assert.equal(parseNumber("-4").kind, "invalid");
    assert.equal(parseNumber("abc").kind, "invalid");
  });

  it("splits shared-meter watts so the shares add up, then ceilings each person", () => {
    const ledger: Ledger = {
      ...emptyLedger(),
      sharedMeters: [
        {
          id: "meter-1",
          name: "السطح",
          previous: "10",
          current: "12.5",
          allocations: [
            { id: "a", name: "سامي", percent: "50" },
            { id: "b", name: "ليلى", percent: "50" },
          ],
        },
      ],
    };
    const view = evaluate(ledger);
    const meter = view.shared[0];
    assert.equal(meter?.adoptedWatts, 2500);
    assert.deepEqual(
      meter?.allocations.map((row) => [row.name, row.watts, row.cost]),
      [
        ["سامي", 1250, 44],
        ["ليلى", 1250, 44],
      ],
    );
    assert.equal(view.totalCost, 88);
    assert.equal(view.totalWatts, 2500);
    assert.equal(view.canClose, true);
    assert.deepEqual(splitWatts(1000, [33.33, 33.33, 33.34]), [333, 333, 334]);
  });

  it("blocks a new week when a reading is missing or goes backwards", () => {
    const missing = sampleLedger();
    missing.subscribers[2]!.current = "";
    const missingView = evaluate(missing);
    assert.equal(missingView.canClose, false);
    assert.equal(closeWeek(missing).ok, false);

    const backwards = sampleLedger();
    backwards.subscribers[0]!.current = "1";
    assert.equal(evaluate(backwards).canClose, false);
    assert.match(evaluate(backwards).issues.join("\n"), /أصغر/);
  });
});

describe("weekly invoice rollover", () => {
  it("snapshots the bill, rolls readings forward, and leaves history frozen", () => {
    const original = sampleLedger();
    const now = new Date("2026-11-02T12:00:00.000Z");
    const closed = closeWeek(original, now);
    assert.equal(closed.ok, true);
    if (!closed.ok) return;

    assert.equal(original.subscribers[0]?.current, "46673.800");
    assert.equal(closed.ledger.subscribers[0]?.previous, "46673.800");
    assert.equal(closed.ledger.subscribers[0]?.current, "");
    assert.equal(closed.ledger.subscribers[3]?.previous, "81.000");
    assert.equal(closed.ledger.subscribers[1]?.splits[0]?.name, "إسماعيل");
    assert.equal(closed.ledger.subscribers[1]?.splits[0]?.kwh, "");
    assert.equal(closed.ledger.settings.pricePerKwh, 35);
    assert.equal(closed.ledger.settings.rounding, "w50");
    assert.equal(closed.invoice.totalCost, 228);
    assert.equal(closed.invoice.totalKwh, 6.45);
    assert.equal(closed.invoice.subscribers.find((row) => row.name === "خليل")?.adoptedKwh, 0.7);
    assert.equal(closed.invoice.subscribers.find((row) => row.name === "خليل")?.cost, 25);

    closed.ledger.subscribers[0]!.name = "اسم جديد";
    closed.ledger.settings.pricePerKwh = 99;
    assert.equal(closed.ledger.history[0]?.subscribers[0]?.name, "عبدو");
    assert.equal(closed.ledger.history[0]?.pricePerKwh, 35);
    assert.equal(closed.ledger.history[0]?.totalCost, 228);

    const again = closeWeek(closed.ledger);
    assert.equal(again.ok, false);

    const report = reportFromInvoice(closed.invoice);
    assert.match(report, /عبدو سابق: 46671\.900 كيلو/);
    assert.match(report, /الاستهلاك: 1\.9 كيلو/);
    assert.match(report, /تكلفة إسماعيل: 2\.6 كيلو/);
    assert.match(report, /تكلفة حوزي: 500 واط/);
    assert.match(report, /الاستهلاك: 700 واط/);
    assert.match(report, /الاستهلاك: 750 واط/);
    assert.match(report, /الإجمالي: 67 شيكل/);
    assert.match(report, /الإجمالي: 109 شيكل/);
    assert.match(report, /المبلغ: 228 شيكل/);
  });
});

describe("json backup", () => {
  it("writes atomically and restores from the temp file if the main file is corrupt", () => {
    const kv = memoryKv();
    saveLedger(kv, sampleLedger());
    assert.equal(kv.dump.has(LEDGER_TMP_KEY), false);
    assert.equal(loadLedger(kv).kind, "loaded");

    const valid = kv.getItem(LEDGER_KEY)!;
    kv.setItem(LEDGER_KEY, "{");
    kv.setItem(LEDGER_TMP_KEY, valid);
    const recovered = loadLedger(kv);
    assert.equal(recovered.kind, "recovered");
    if (recovered.kind !== "recovered") return;
    assert.equal(recovered.ledger.subscribers.length, 4);
  });

  it("rejects an invalid backup and accepts a round-trip", () => {
    assert.equal(parseLedgerJson("not-json").ok, false);
    assert.equal(parseLedgerJson("{\"version\":2}").ok, false);
    const parsed = parseLedgerJson(serializeLedger(sampleLedger()));
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    assert.equal(evaluate(parsed.ledger).totalCost, 228);
  });
});
