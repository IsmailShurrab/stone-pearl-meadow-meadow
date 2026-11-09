import { Copy, History, Plus, Settings, Share2, Zap } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast, Toaster } from "sonner";
import {
  blankAllocation,
  blankSharedMeter,
  blankSplit,
  blankSubscriber,
  closeWeek,
  emptyLedger,
  equalPercentStrings,
  evaluate,
  sampleLedger,
  type Allocation,
  type Invoice,
  type Ledger,
  type SharedMeter,
  type SplitLine,
  type Subscriber,
} from "@/lib/electricity/model";
import {
  formatMoney,
  formatPrice,
  formatTableKwh,
  formatTotalKwh,
  parseNumber,
  roundingLabel,
  type RoundingMode,
} from "@/lib/electricity/money";
import { formatArabicDate, reportFromInvoice, reportFromLedger } from "@/lib/electricity/report";
import {
  androidLedger,
  loadAndroidLedger,
  loadLedger,
  parseLedgerJson,
  saveLedger,
  serializeLedger,
} from "@/lib/electricity/storage";
import { SharedMeterCard, SubscriberCard } from "./cards";
import { Button, Sheet } from "./ui";

type Tab = "now" | "history" | "settings";
type Dialog =
  | null
  | { kind: "problems" }
  | { kind: "close" }
  | { kind: "reset" }
  | { kind: "sample" }
  | { kind: "import"; ledger: Ledger }
  | { kind: "import-error"; message: string };

const HINT_KEY = "electricity-sample-hint";

function downloadText(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

async function copyText(text: string) {
  const bridge = androidLedger();
  if (bridge?.copyText) {
    bridge.copyText(text);
    toast("تم نسخ التقرير");
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    toast("تم نسخ التقرير");
  } catch {
    downloadText("فاتورة-الكهرباء.txt", text, "text/plain;charset=utf-8");
    toast("تعذر النسخ، تم تنزيل النص بدلاً من ذلك");
  }
}

async function shareText(text: string) {
  const bridge = androidLedger();
  if (bridge?.shareText) {
    bridge.shareText(text);
    return;
  }
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title: "فاتورة الكهرباء", text });
      return;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
    }
  }
  await copyText(text);
}

export function LedgerApp() {
  const [ledger, setLedger] = useState<Ledger>(() => sampleLedger());
  const [persist, setPersist] = useState(false);
  const [usingFile, setUsingFile] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [corruptRaw, setCorruptRaw] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("now");
  const [hint, setHint] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const view = useMemo(() => evaluate(ledger), [ledger]);
  const draftReport = useMemo(() => reportFromLedger(ledger, view), [ledger, view]);

  useEffect(() => {
    const bridge = androidLedger();
    const apply = (result: ReturnType<typeof loadLedger>) => {
      if (result.kind === "loaded" || result.kind === "recovered") {
        setLedger(result.ledger);
        if (result.kind === "recovered") setWarning("تم استرداد آخر حفظ سليم.");
      } else if (result.kind === "corrupt") {
        setWarning(result.message);
        setCorruptRaw(result.raw);
        setPersist(false);
        return;
      } else if (typeof localStorage !== "undefined" && localStorage.getItem(HINT_KEY) !== "off") {
        setHint(true);
      }
      setPersist(true);
    };

    if (bridge) {
      setUsingFile(true);
      apply(loadAndroidLedger(bridge.storageLoad()));
      return;
    }
    if (typeof localStorage === "undefined") return;
    apply(loadLedger(localStorage));
  }, []);

  useEffect(() => {
    if (!persist) return;
    const bridge = androidLedger();
    if (bridge) {
      bridge.storageSave(JSON.stringify(ledger));
      return;
    }
    if (typeof localStorage === "undefined") return;
    saveLedger(localStorage, ledger);
  }, [ledger, persist]);

  useEffect(() => {
    const host = window as Window & { __electricityImport?: (text: string) => void };
    host.__electricityImport = (text: string) => {
      const parsed = parseLedgerJson(text);
      if (!parsed.ok) {
        setDialog({ kind: "import-error", message: parsed.message });
        return;
      }
      setDialog({ kind: "import", ledger: parsed.ledger });
    };
    return () => {
      delete host.__electricityImport;
    };
  }, []);

  function update(recipe: (current: Ledger) => Ledger) {
    setLedger((current) => recipe(current));
  }

  function patchSubscriber(id: string, patch: Partial<Subscriber>) {
    update((current) => ({
      ...current,
      subscribers: current.subscribers.map((subscriber) =>
        subscriber.id === id ? { ...subscriber, ...patch } : subscriber,
      ),
    }));
  }

  function patchSplit(subscriberId: string, splitId: string, patch: Partial<SplitLine>) {
    update((current) => ({
      ...current,
      subscribers: current.subscribers.map((subscriber) =>
        subscriber.id === subscriberId
          ? {
              ...subscriber,
              splits: subscriber.splits.map((split) => (split.id === splitId ? { ...split, ...patch } : split)),
            }
          : subscriber,
      ),
    }));
  }

  function patchMeter(id: string, patch: Partial<SharedMeter>) {
    update((current) => ({
      ...current,
      sharedMeters: current.sharedMeters.map((meter) => (meter.id === id ? { ...meter, ...patch } : meter)),
    }));
  }

  function patchAllocation(meterId: string, allocationId: string, patch: Partial<Allocation>) {
    update((current) => ({
      ...current,
      sharedMeters: current.sharedMeters.map((meter) =>
        meter.id === meterId
          ? {
              ...meter,
              allocations: meter.allocations.map((allocation) =>
                allocation.id === allocationId ? { ...allocation, ...patch } : allocation,
              ),
            }
          : meter,
      ),
    }));
  }

  function addSubscriber() {
    const subscriber = blankSubscriber();
    update((current) => ({ ...current, subscribers: [...current.subscribers, subscriber] }));
    setTab("now");
    requestAnimationFrame(() => {
      document.getElementById(`sub-${subscriber.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  function addMeter() {
    const meter = blankSharedMeter();
    update((current) => ({ ...current, sharedMeters: [...current.sharedMeters, meter] }));
    setTab("now");
    requestAnimationFrame(() => {
      document.getElementById(`meter-${meter.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  function requestClose() {
    setDialog(view.canClose ? { kind: "close" } : { kind: "problems" });
  }

  function confirmClose() {
    const current = ledger;
    const result = closeWeek(current);
    if (!result.ok) {
      setDialog({ kind: "problems" });
      return;
    }
    setLedger(result.ledger);
    setDialog(null);
    setTab("now");
    toast("حُفظت الفاتورة ورُحّلت القراءات", {
      action: { label: "تراجع", onClick: () => setLedger(current) },
    });
  }

  function replaceLedger(next: Ledger, message: string) {
    setLedger(next);
    setPersist(true);
    setWarning(null);
    setCorruptRaw(null);
    setDialog(null);
    setInvoiceId(null);
    setTab("now");
    toast(message);
  }

  function exportBackup() {
    const json = serializeLedger(ledger);
    const filename = `electricity-backup-${new Date().toISOString().slice(0, 10)}.json`;
    const bridge = androidLedger();
    if (bridge?.exportJson) {
      bridge.exportJson(filename, json);
      return;
    }
    downloadText(filename, json, "application/json;charset=utf-8");
    toast("تم تنزيل النسخة الاحتياطية");
  }

  function onImportFile(file: File) {
    void file.text().then((text) => {
      const parsed = parseLedgerJson(text);
      if (!parsed.ok) {
        setDialog({ kind: "import-error", message: parsed.message });
        return;
      }
      setDialog({ kind: "import", ledger: parsed.ledger });
    });
  }

  const openInvoice: Invoice | undefined = ledger.history.find((invoice) => invoice.id === invoiceId);
  const tableRows = [
    ...view.subscribers
      .filter((row) => row.adoptedWatts !== null && row.cost !== null)
      .map((row) => ({
        key: row.id,
        name: row.name || "بدون اسم",
        kwh: formatTableKwh(row.adoptedWatts ?? 0, ledger.settings.rounding),
        cost: row.cost ?? 0,
      })),
    ...view.shared.flatMap((meter) =>
      meter.cost === null
        ? []
        : meter.allocations
            .filter((allocation) => allocation.cost !== null && allocation.watts !== null)
            .map((allocation) => ({
              key: allocation.id,
              name: allocation.name,
              kwh: formatTableKwh(allocation.watts ?? 0, ledger.settings.rounding),
              cost: allocation.cost ?? 0,
            })),
    ),
  ];

  return (
    <div className="min-h-screen bg-bg text-fg">
      <Toaster position="top-center" dir="rtl" />
      <div className="mx-auto min-h-screen max-w-lg">
        <header className="sticky top-0 z-20 border-b border-border bg-bg/95 px-4 py-3 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-2xl bg-primary text-primary-fg">
                <Zap className="size-4" />
              </span>
              <h1 className="text-lg font-semibold">حاسبة الكهرباء</h1>
            </div>
            {tab === "now" ? (
              <div className="flex items-center gap-1">
                <Button variant="ghost" className="size-11 px-0" aria-label="نسخ التقرير" onClick={() => void copyText(draftReport)}>
                  <Copy className="size-5" />
                </Button>
                <Button variant="ghost" className="size-11 px-0" aria-label="مشاركة التقرير" onClick={() => void shareText(draftReport)}>
                  <Share2 className="size-5" />
                </Button>
              </div>
            ) : null}
          </div>
          <div className="mt-3 flex items-end justify-between gap-3" aria-live="polite">
            <div>
              <p className="text-sm text-muted">{view.canClose ? "المبلغ المستحق" : "المجموع حتى الآن"}</p>
              <p className="text-5xl font-semibold tabular-nums leading-none text-accent">{view.totalCost}</p>
              <p className="mt-1 text-sm text-muted">شيكل</p>
            </div>
            <div className="text-end">
              <p className="text-lg font-medium tabular-nums">{formatTotalKwh(view.totalWatts)}</p>
              <p className="text-sm text-muted">
                {formatPrice(ledger.settings.pricePerKwh)} شيكل/كيلو · {roundingLabel(ledger.settings.rounding)}
              </p>
            </div>
          </div>
        </header>

        <main className={tab === "now" ? "space-y-4 px-4 pt-4 pb-40" : "space-y-4 px-4 pt-4 pb-24"}>
          {warning ? (
            <div className="rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
              <p>{warning}</p>
              {corruptRaw ? (
                <button
                  type="button"
                  className="mt-2 font-medium underline"
                  onClick={() => downloadText("ledger-corrupt.json", corruptRaw, "application/json")}
                >
                  تنزيل الملف التالف
                </button>
              ) : null}
            </div>
          ) : null}

          {tab === "now" ? (
            <>
              {hint ? (
                <div className="rounded-2xl bg-warn-soft px-4 py-3 text-sm text-warn">
                  <p>هذه أرقام المثال: السعر 35 شيكل، والتقريب لأقرب 50 واط. المجموع المتوقع 228 شيكل.</p>
                  <button
                    type="button"
                    className="mt-2 font-medium"
                    onClick={() => {
                      localStorage.setItem(HINT_KEY, "off");
                      setHint(false);
                    }}
                  >
                    فهمت
                  </button>
                </div>
              ) : null}

              <section className="overflow-hidden rounded-3xl border border-border bg-surface">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted">
                      <th className="px-4 py-3 text-start font-medium">المشترك</th>
                      <th className="px-2 py-3 text-end font-medium">الاستهلاك</th>
                      <th className="px-4 py-3 text-end font-medium">شيكل</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-4 text-muted">
                          ستظهر الأرقام بعد إدخال القراءة السابقة والحالية.
                        </td>
                      </tr>
                    ) : (
                      tableRows.map((row) => (
                        <tr key={row.key} className="border-t border-border">
                          <td className="px-4 py-3 font-medium">{row.name}</td>
                          <td className="px-2 py-3 text-end tabular-nums" dir="ltr">
                            {row.kwh}
                          </td>
                          <td className="px-4 py-3 text-end font-semibold tabular-nums text-primary" dir="ltr">
                            {row.cost}
                          </td>
                        </tr>
                      ))
                    )}
                    <tr className="border-t border-border bg-ok-soft">
                      <td className="px-4 py-3 font-semibold">الإجمالي</td>
                      <td className="px-2 py-3 text-end font-semibold tabular-nums" dir="ltr">
                        {formatTableKwh(view.totalWatts, ledger.settings.rounding)}
                      </td>
                      <td className="px-4 py-3 text-end text-lg font-semibold tabular-nums text-accent" dir="ltr">
                        {view.totalCost}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </section>

              <div className="space-y-3">
                {ledger.subscribers.map((subscriber) => {
                  const row = view.subscribers.find((item) => item.id === subscriber.id);
                  if (!row) return null;
                  return (
                    <SubscriberCard
                      key={subscriber.id}
                      subscriber={subscriber}
                      row={row}
                      onPatch={(patch) => patchSubscriber(subscriber.id, patch)}
                      onRemove={() =>
                        update((current) => ({
                          ...current,
                          subscribers: current.subscribers.filter((item) => item.id !== subscriber.id),
                        }))
                      }
                      onAddSplit={() =>
                        update((current) => ({
                          ...current,
                          subscribers: current.subscribers.map((item) =>
                            item.id === subscriber.id ? { ...item, splits: [...item.splits, blankSplit()] } : item,
                          ),
                        }))
                      }
                      onPatchSplit={(splitId, patch) => patchSplit(subscriber.id, splitId, patch)}
                      onRemoveSplit={(splitId) =>
                        update((current) => ({
                          ...current,
                          subscribers: current.subscribers.map((item) =>
                            item.id === subscriber.id
                              ? { ...item, splits: item.splits.filter((split) => split.id !== splitId) }
                              : item,
                          ),
                        }))
                      }
                    />
                  );
                })}
              </div>

              {ledger.sharedMeters.length > 0 ? (
                <div className="space-y-3">
                  {ledger.sharedMeters.map((meter) => {
                    const row = view.shared.find((item) => item.id === meter.id);
                    if (!row) return null;
                    return (
                      <SharedMeterCard
                        key={meter.id}
                        meter={meter}
                        row={row}
                        onPatch={(patch) => patchMeter(meter.id, patch)}
                        onRemove={() =>
                          update((current) => ({
                            ...current,
                            sharedMeters: current.sharedMeters.filter((item) => item.id !== meter.id),
                          }))
                        }
                        onAddAllocation={() =>
                          update((current) => ({
                            ...current,
                            sharedMeters: current.sharedMeters.map((item) =>
                              item.id === meter.id
                                ? { ...item, allocations: [...item.allocations, blankAllocation()] }
                                : item,
                            ),
                          }))
                        }
                        onPatchAllocation={(allocationId, patch) => patchAllocation(meter.id, allocationId, patch)}
                        onRemoveAllocation={(allocationId) =>
                          update((current) => ({
                            ...current,
                            sharedMeters: current.sharedMeters.map((item) =>
                              item.id === meter.id
                                ? {
                                    ...item,
                                    allocations: item.allocations.filter((allocation) => allocation.id !== allocationId),
                                  }
                                : item,
                            ),
                          }))
                        }
                        onEqualize={() =>
                          update((current) => ({
                            ...current,
                            sharedMeters: current.sharedMeters.map((item) => {
                              if (item.id !== meter.id) return item;
                              const percents = equalPercentStrings(item.allocations.length);
                              return {
                                ...item,
                                allocations: item.allocations.map((allocation, index) => ({
                                  ...allocation,
                                  percent: percents[index] ?? "",
                                })),
                              };
                            }),
                          }))
                        }
                      />
                    );
                  })}
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-2">
                <Button onClick={addSubscriber}>
                  <Plus className="size-4" />
                  مشترك جديد
                </Button>
                <Button onClick={addMeter}>
                  <Plus className="size-4" />
                  عداد مشترك
                </Button>
              </div>

              <section>
                <h2 className="mb-2 text-base font-semibold">نص التقرير</h2>
                <pre className="ledger-lines whitespace-pre-wrap rounded-3xl border border-border px-4 py-3 font-sans text-sm text-fg">
                  {draftReport}
                </pre>
              </section>
            </>
          ) : null}

          {tab === "history" ? (
            openInvoice ? (
              <HistoryDetail
                invoice={openInvoice}
                onBack={() => setInvoiceId(null)}
                onDelete={() => {
                  update((current) => ({
                    ...current,
                    history: current.history.filter((item) => item.id !== openInvoice.id),
                  }));
                  setInvoiceId(null);
                  toast("حُذفت الفاتورة من السجل");
                }}
              />
            ) : (
              <HistoryList invoices={ledger.history} onOpen={setInvoiceId} />
            )
          ) : null}

          {tab === "settings" ? (
            <SettingsPanel
              ledger={ledger}
              usingFile={usingFile}
              onPrice={(pricePerKwh) =>
                update((current) => ({ ...current, settings: { ...current.settings, pricePerKwh } }))
              }
              onRounding={(rounding) =>
                update((current) => ({ ...current, settings: { ...current.settings, rounding } }))
              }
              onExport={exportBackup}
              onImport={() => {
                const bridge = androidLedger();
                if (bridge?.importJson) {
                  bridge.importJson();
                  return;
                }
                fileRef.current?.click();
              }}
              onSample={() => setDialog({ kind: "sample" })}
              onReset={() => setDialog({ kind: "reset" })}
            />
          ) : null}
        </main>

        {tab === "now" ? (
          <div className="fixed inset-x-0 bottom-16 z-30">
            <div className="mx-auto max-w-lg px-4 pb-2">
              <Button variant="primary" className="h-14 w-full text-lg" onClick={requestClose}>
                إنشاء فاتورة أسبوع جديد
              </Button>
            </div>
          </div>
        ) : null}

        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface">
          <div className="mx-auto grid max-w-lg grid-cols-3">
            <NavButton active={tab === "now"} label="الحساب" onClick={() => setTab("now")}>
              <Zap className="size-5" />
            </NavButton>
            <NavButton active={tab === "history"} label="السجل" onClick={() => setTab("history")}>
              <History className="size-5" />
            </NavButton>
            <NavButton active={tab === "settings"} label="الإعدادات" onClick={() => setTab("settings")}>
              <Settings className="size-5" />
            </NavButton>
          </div>
        </nav>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onImportFile(file);
        }}
      />

      <Sheet open={dialog?.kind === "problems"} title="لا يمكن إقفال الأسبوع" onClose={() => setDialog(null)}>
        <ul className="space-y-2 text-sm text-fg">
          {view.issues.map((issue) => (
            <li key={issue} className="rounded-2xl bg-danger-soft px-3 py-2 text-danger">
              {issue}
            </li>
          ))}
        </ul>
        <Button className="mt-4 w-full" onClick={() => setDialog(null)}>
          رجوع للتعديل
        </Button>
      </Sheet>

      <Sheet open={dialog?.kind === "close"} title="فاتورة أسبوع جديد" onClose={() => setDialog(null)}>
        <p className="text-sm leading-6 text-muted">
          ستُحفظ الفاتورة في السجل كما هي الآن، ولن تتأثر إن غيّرت الأسماء أو السعر لاحقاً. القراءة الحالية تصبح
          السابقة، وتُفرَّغ خانة الحالية.
        </p>
        <p className="mt-3 text-3xl font-semibold tabular-nums text-accent">
          {view.totalCost} <span className="text-base font-medium text-muted">شيكل</span>
        </p>
        <p className="text-sm text-muted">{formatTotalKwh(view.totalWatts)}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="ghost" onClick={() => setDialog(null)}>
            رجوع
          </Button>
          <Button variant="primary" onClick={confirmClose}>
            تأكيد الحفظ
          </Button>
        </div>
      </Sheet>

      <Sheet open={dialog?.kind === "reset"} title="بدء دفتر فارغ؟" onClose={() => setDialog(null)}>
        <p className="text-sm leading-6 text-muted">
          يُحذف المشتركون وقراءات هذا الأسبوع والسجل من هذا الجهاز. صدّر نسخة احتياطية أولاً إن كنت بحاجة إليها.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="ghost" onClick={() => setDialog(null)}>
            إلغاء
          </Button>
          <Button variant="danger" onClick={() => replaceLedger(emptyLedger(), "بدأ دفتر جديد")}>
            حذف الدفتر
          </Button>
        </div>
      </Sheet>

      <Sheet open={dialog?.kind === "sample"} title="تحميل مثال الاختبار؟" onClose={() => setDialog(null)}>
        <p className="text-sm leading-6 text-muted">
          يستبدل الدفتر الحالي بأرقام عبدو ومحمد وخليل وأبو أنس. الفواتير المحفوظة حالياً ستُحذف من الجهاز.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="ghost" onClick={() => setDialog(null)}>
            إلغاء
          </Button>
          <Button variant="primary" onClick={() => replaceLedger(sampleLedger(), "تم تحميل المثال")}>
            تحميل
          </Button>
        </div>
      </Sheet>

      <Sheet open={dialog?.kind === "import"} title="استعادة النسخة الاحتياطية؟" onClose={() => setDialog(null)}>
        {dialog?.kind === "import" ? (
          <>
            <p className="text-sm leading-6 text-muted">
              الملف يحتوي على {dialog.ledger.subscribers.length} مشتركين و{dialog.ledger.sharedMeters.length} عدادات
              مشتركة و{dialog.ledger.history.length} فواتير. سيتم استبدال البيانات الحالية.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button variant="ghost" onClick={() => setDialog(null)}>
                إلغاء
              </Button>
              <Button
                variant="primary"
                onClick={() => replaceLedger(dialog.ledger, "تمت استعادة النسخة الاحتياطية")}
              >
                استعادة
              </Button>
            </div>
          </>
        ) : null}
      </Sheet>

      <Sheet
        open={dialog?.kind === "import-error"}
        title="تعذر الاستيراد"
        onClose={() => setDialog(null)}
      >
        <p className="text-sm leading-6 text-danger">
          {dialog?.kind === "import-error" ? dialog.message : ""}
        </p>
        <Button className="mt-4 w-full" onClick={() => setDialog(null)}>
          حسناً
        </Button>
      </Sheet>
    </div>
  );
}

function NavButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "flex h-16 flex-col items-center justify-center gap-1 text-sm font-medium text-primary"
          : "flex h-16 flex-col items-center justify-center gap-1 text-sm text-muted"
      }
    >
      {children}
      {label}
    </button>
  );
}

function HistoryList({ invoices, onOpen }: { invoices: Invoice[]; onOpen: (id: string) => void }) {
  if (invoices.length === 0) {
    return (
      <div className="rounded-3xl border border-border bg-surface px-4 py-8 text-center">
        <p className="text-lg font-semibold">لا توجد فواتير بعد</p>
        <p className="mt-2 text-sm leading-6 text-muted">
          بعد إكمال قراءات الأسبوع، اضغط «إنشاء فاتورة أسبوع جديد» ليُحفظ الكشف وتُرحَّل القراءات.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted">الفواتير القديمة ثابتة ولا تتغير إذا عدّلت المشتركين لاحقاً.</p>
      {invoices.map((invoice) => (
        <button
          key={invoice.id}
          type="button"
          onClick={() => onOpen(invoice.id)}
          className="flex w-full items-center justify-between rounded-3xl border border-border bg-surface px-4 py-3 text-start"
        >
          <span>
            <span className="block font-semibold">{formatArabicDate(invoice.createdAt)}</span>
            <span className="mt-1 block text-sm text-muted">
              {formatTotalKwh(Math.round(invoice.totalKwh * 1000))} · {roundingLabel(invoice.rounding)}
            </span>
          </span>
          <span className="text-2xl font-semibold tabular-nums text-accent">{invoice.totalCost}</span>
        </button>
      ))}
    </div>
  );
}

function HistoryDetail({
  invoice,
  onBack,
  onDelete,
}: {
  invoice: Invoice;
  onBack: () => void;
  onDelete: () => void;
}) {
  const [ask, setAsk] = useState(false);
  const report = reportFromInvoice(invoice);
  return (
    <div className="space-y-3">
      <Button variant="ghost" className="h-11 px-2" onClick={onBack}>
        رجوع إلى السجل
      </Button>
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-semibold">{formatArabicDate(invoice.createdAt)}</h2>
          <p className="text-sm text-muted">
            {formatPrice(invoice.pricePerKwh)} شيكل/كيلو · {roundingLabel(invoice.rounding)}
          </p>
        </div>
        <p className="text-3xl font-semibold tabular-nums text-accent">{formatMoney(invoice.totalCost)}</p>
      </div>
      <pre className="ledger-lines whitespace-pre-wrap rounded-3xl border border-border px-4 py-3 font-sans text-sm text-fg">
        {report}
      </pre>
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={() => void copyText(report)}>
          <Copy className="size-4" />
          نسخ
        </Button>
        <Button onClick={() => void shareText(report)}>
          <Share2 className="size-4" />
          مشاركة
        </Button>
      </div>
      {ask ? (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="ghost" onClick={() => setAsk(false)}>
            إلغاء
          </Button>
          <Button variant="danger" onClick={onDelete}>
            تأكيد الحذف
          </Button>
        </div>
      ) : (
        <Button variant="danger" className="w-full" onClick={() => setAsk(true)}>
          حذف هذه الفاتورة
        </Button>
      )}
    </div>
  );
}

function SettingsPanel({
  ledger,
  usingFile,
  onPrice,
  onRounding,
  onExport,
  onImport,
  onSample,
  onReset,
}: {
  ledger: Ledger;
  usingFile: boolean;
  onPrice: (price: number) => void;
  onRounding: (mode: RoundingMode) => void;
  onExport: () => void;
  onImport: () => void;
  onSample: () => void;
  onReset: () => void;
}) {
  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-border bg-surface p-4">
        <h2 className="text-lg font-semibold">سعر الكيلو واط</h2>
        <p className="mt-1 text-sm text-muted">الافتراضي 35 شيكل. تغييره لا يعدّل الفواتير المحفوظة.</p>
        <PriceField price={ledger.settings.pricePerKwh} onCommit={onPrice} />
      </section>

      <section className="rounded-3xl border border-border bg-surface p-4">
        <h2 className="text-lg font-semibold">تقريب الاستهلاك</h2>
        <p className="mt-1 text-sm leading-6 text-muted">
          التكلفة = الاستهلاك المعتمد × السعر، ثم تُقرَّب كل فاتورة للأعلى إلى أقرب شيكل. الإجمالي هو مجموع الفواتير بعد
          هذا التقريب.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-2">
          {(
            [
              ["w50", "أقرب 50 واط"],
              ["w100", "أقرب 100 واط"],
              ["exact", "قراءة دقيقة"],
            ] as const
          ).map(([mode, label]) => {
            const active = ledger.settings.rounding === mode;
            return (
              <button
                key={mode}
                type="button"
                aria-pressed={active}
                onClick={() => onRounding(mode)}
                className={
                  active
                    ? "h-12 rounded-2xl bg-primary px-4 text-start font-medium text-primary-fg"
                    : "h-12 rounded-2xl border border-border bg-bg px-4 text-start font-medium text-fg"
                }
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-surface p-4">
        <h2 className="text-lg font-semibold">النسخة الاحتياطية</h2>
        <p className="mt-1 text-sm leading-6 text-muted">
          {usingFile
            ? "البيانات في ملف JSON داخل التطبيق، وتُكتب في ملف مؤقت ثم تُستبدل."
            : "البيانات تُحفظ تلقائياً على هذا الجهاز في ملف JSON محلي، وتبقى بعد إغلاق الصفحة. لا يوجد اتصال بخادم."}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button onClick={onExport}>تصدير JSON</Button>
          <Button onClick={onImport}>استيراد JSON</Button>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-surface p-4">
        <h2 className="text-lg font-semibold">الدفتر</h2>
        <div className="mt-3 grid grid-cols-1 gap-2">
          <Button onClick={onSample}>تحميل مثال الاختبار</Button>
          <Button variant="danger" onClick={onReset}>
            بدء دفتر فارغ
          </Button>
        </div>
      </section>
    </div>
  );
}

function PriceField({ price, onCommit }: { price: number; onCommit: (price: number) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(() => formatPrice(price));
  useEffect(() => {
    if (document.activeElement !== ref.current) setText(formatPrice(price));
  }, [price]);
  return (
    <label className="mt-3 block">
      <span className="sr-only">سعر الكيلو واط بالشيكل</span>
      <input
        ref={ref}
        dir="ltr"
        inputMode="decimal"
        value={text}
        onChange={(event) => {
          const next = event.target.value;
          setText(next);
          const parsed = parseNumber(next);
          if (parsed.kind === "ok" && parsed.value > 0 && parsed.value <= 1_000_000) onCommit(parsed.value);
        }}
        onBlur={() => setText(formatPrice(price))}
        className="h-14 w-full rounded-2xl border border-border bg-bg px-3 text-left text-3xl font-semibold tabular-nums outline-none focus:border-primary"
      />
    </label>
  );
}
