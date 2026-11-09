import { ledgerSchema, type Ledger } from "./model.ts";

export const LEDGER_KEY = "electricity-ledger-v1";
export const LEDGER_TMP_KEY = "electricity-ledger-v1.tmp";

export interface Kv {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type ParseResult = { ok: true; ledger: Ledger } | { ok: false; message: string };

export function parseLedgerJson(text: string): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, message: "تعذر قراءة الملف. تأكد أنه ملف JSON سليم." };
  }
  const parsed = ledgerSchema.safeParse(data);
  if (!parsed.success) {
    return {
      ok: false,
      message: "الملف لا يطابق بيانات حاسبة الكهرباء. تأكد أنه نسخة احتياطية من هذا التطبيق.",
    };
  }
  return { ok: true, ledger: parsed.data };
}

export function serializeLedger(ledger: Ledger): string {
  return JSON.stringify(ledger, null, 2);
}

export type LoadResult =
  | { kind: "empty" }
  | { kind: "loaded"; ledger: Ledger }
  | { kind: "recovered"; ledger: Ledger }
  | { kind: "corrupt"; message: string; raw: string };

export function loadLedger(kv: Kv): LoadResult {
  const main = kv.getItem(LEDGER_KEY);
  const tmp = kv.getItem(LEDGER_TMP_KEY);
  if (main) {
    const parsed = parseLedgerJson(main);
    if (parsed.ok) return { kind: "loaded", ledger: parsed.ledger };
  }
  if (tmp) {
    const parsed = parseLedgerJson(tmp);
    if (parsed.ok) return { kind: "recovered", ledger: parsed.ledger };
  }
  const raw = main || tmp;
  if (raw) {
    return {
      kind: "corrupt",
      message: "تعذر فتح البيانات المحفوظة على هذا الجهاز.",
      raw,
    };
  }
  return { kind: "empty" };
}

/** Write the temp payload first, then replace the main key, then drop the temp. */
export function saveLedger(kv: Kv, ledger: Ledger): void {
  const json = JSON.stringify(ledger);
  kv.setItem(LEDGER_TMP_KEY, json);
  kv.setItem(LEDGER_KEY, json);
  kv.removeItem(LEDGER_TMP_KEY);
}

export type AndroidLedger = {
  storageLoad: () => string;
  storageSave: (json: string) => void;
  shareText: (text: string) => void;
  copyText: (text: string) => void;
  exportJson: (filename: string, content: string) => void;
  importJson: () => void;
};

export function androidLedger(): AndroidLedger | null {
  if (typeof window === "undefined") return null;
  const host = window as Window & { AndroidLedger?: Partial<AndroidLedger> };
  const bridge = host.AndroidLedger;
  if (!bridge || typeof bridge.storageLoad !== "function" || typeof bridge.storageSave !== "function") {
    return null;
  }
  return bridge as AndroidLedger;
}

export function loadAndroidLedger(text: string): LoadResult {
  if (!text.trim()) return { kind: "empty" };
  const parsed = parseLedgerJson(text);
  if (!parsed.ok) return { kind: "corrupt", message: parsed.message, raw: text };
  return { kind: "loaded", ledger: parsed.ledger };
}
