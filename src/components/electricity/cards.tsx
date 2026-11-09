import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Allocation, SharedMeter, SplitLine, Subscriber } from "@/lib/electricity/model";
import {
  readingIssueLabel,
  type SharedEval,
  type SubscriberEval,
} from "@/lib/electricity/model";
import { formatConsumption, formatMoney } from "@/lib/electricity/money";
import { Button, IconButton, ReadingField } from "./ui";

export function SubscriberCard({
  subscriber,
  row,
  onPatch,
  onRemove,
  onAddSplit,
  onPatchSplit,
  onRemoveSplit,
}: {
  subscriber: Subscriber;
  row: SubscriberEval;
  onPatch: (patch: Partial<Subscriber>) => void;
  onRemove: () => void;
  onAddSplit: () => void;
  onPatchSplit: (splitId: string, patch: Partial<SplitLine>) => void;
  onRemoveSplit: (splitId: string) => void;
}) {
  const [askDelete, setAskDelete] = useState(false);
  const [splitsOpen, setSplitsOpen] = useState(subscriber.splits.length > 0);
  const invalid = row.issue === "invalid" || row.issue === "decreased" || row.issue === "partial";

  return (
    <article id={`sub-${subscriber.id}`} className="rounded-3xl border border-border bg-surface p-4">
      <div className="flex items-start gap-2">
        <input
          value={subscriber.name}
          aria-label="اسم المشترك"
          placeholder="اسم المشترك"
          onChange={(event) => onPatch({ name: event.target.value })}
          className="h-11 min-w-0 flex-1 bg-transparent text-xl font-semibold text-fg outline-none placeholder:text-muted/70"
        />
        {askDelete ? (
          <div className="flex items-center gap-1">
            <Button variant="danger" className="h-11 px-3" onClick={onRemove}>
              حذف
            </Button>
            <Button variant="ghost" className="h-11 px-3" onClick={() => setAskDelete(false)}>
              إلغاء
            </Button>
          </div>
        ) : (
          <IconButton aria-label={`حذف ${subscriber.name || "المشترك"}`} onClick={() => setAskDelete(true)}>
            <Trash2 className="size-5" />
          </IconButton>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <ReadingField
          label="سابق"
          value={subscriber.previous}
          invalid={invalid}
          onChange={(previous) => onPatch({ previous })}
        />
        <ReadingField
          label="حالي"
          value={subscriber.current}
          invalid={invalid}
          onChange={(current) => onPatch({ current })}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3">
        <div>
          <p className="text-sm text-muted">الاستهلاك المعتمد</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-fg">
            {row.adoptedWatts === null ? "—" : formatConsumption(row.adoptedWatts)}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted">التكلفة</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-primary">
            {row.cost === null ? "—" : formatMoney(row.cost)}
          </p>
        </div>
      </div>

      {row.issue ? <p className="mt-2 text-sm text-danger">{readingIssueLabel(row.issue)}</p> : null}
      {row.rawWatts !== null && row.adoptedWatts !== null && row.rawWatts !== row.adoptedWatts ? (
        <p className="mt-2 text-sm text-warn">
          فرق العداد {formatConsumption(row.rawWatts)} · بعد التقريب {formatConsumption(row.adoptedWatts)}
        </p>
      ) : null}
      {row.splitWarning ? <p className="mt-2 text-sm text-warn">{row.splitWarning}</p> : null}

      <button
        type="button"
        className="mt-3 text-sm font-medium text-primary"
        onClick={() => setSplitsOpen((open) => !open)}
        aria-expanded={splitsOpen}
      >
        {splitsOpen ? "إخفاء التوزيع" : "توزيع في التقرير"}
        {subscriber.splits.length > 0 ? ` (${subscriber.splits.length})` : ""}
      </button>

      {splitsOpen ? (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-muted">يظهر في التقرير فقط، ولا يُضاف فوق استهلاك العداد.</p>
          {subscriber.splits.map((split) => (
            <div key={split.id} className="flex items-center gap-2">
              <input
                value={split.name}
                aria-label="اسم الشخص في التوزيع"
                placeholder="الاسم"
                onChange={(event) => onPatchSplit(split.id, { name: event.target.value })}
                className="h-12 min-w-0 flex-1 rounded-2xl border border-border bg-bg px-3 text-fg outline-none focus:border-primary"
              />
              <input
                dir="ltr"
                inputMode="decimal"
                value={split.kwh}
                aria-label="كمية التوزيع بالكيلو"
                placeholder="كيلو"
                onChange={(event) => onPatchSplit(split.id, { kwh: event.target.value })}
                className="h-12 w-24 rounded-2xl border border-border bg-bg px-3 text-left tabular-nums outline-none focus:border-primary"
              />
              <IconButton aria-label="حذف بند التوزيع" onClick={() => onRemoveSplit(split.id)}>
                <Trash2 className="size-4" />
              </IconButton>
            </div>
          ))}
          <Button variant="ghost" className="h-11 px-2" onClick={onAddSplit}>
            <Plus className="size-4" />
            إضافة شخص
          </Button>
        </div>
      ) : null}
    </article>
  );
}

export function SharedMeterCard({
  meter,
  row,
  onPatch,
  onRemove,
  onAddAllocation,
  onPatchAllocation,
  onRemoveAllocation,
  onEqualize,
}: {
  meter: SharedMeter;
  row: SharedEval;
  onPatch: (patch: Partial<SharedMeter>) => void;
  onRemove: () => void;
  onAddAllocation: () => void;
  onPatchAllocation: (allocationId: string, patch: Partial<Allocation>) => void;
  onRemoveAllocation: (allocationId: string) => void;
  onEqualize: () => void;
}) {
  const [askDelete, setAskDelete] = useState(false);
  const invalid = row.issue === "invalid" || row.issue === "decreased" || row.issue === "partial";

  return (
    <article id={`meter-${meter.id}`} className="rounded-3xl border border-primary/30 bg-surface p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="rounded-full bg-ok-soft px-3 py-1 text-sm font-medium text-primary">عداد مشترك</p>
        {askDelete ? (
          <div className="flex items-center gap-1">
            <Button variant="danger" className="h-11 px-3" onClick={onRemove}>
              حذف
            </Button>
            <Button variant="ghost" className="h-11 px-3" onClick={() => setAskDelete(false)}>
              إلغاء
            </Button>
          </div>
        ) : (
          <IconButton aria-label="حذف العداد المشترك" onClick={() => setAskDelete(true)}>
            <Trash2 className="size-5" />
          </IconButton>
        )}
      </div>
      <input
        value={meter.name}
        aria-label="اسم العداد المشترك"
        placeholder="اسم العداد"
        onChange={(event) => onPatch({ name: event.target.value })}
        className="h-11 w-full bg-transparent text-xl font-semibold text-fg outline-none placeholder:text-muted/70"
      />
      <p className="mt-1 text-sm text-muted">كل حصة فاتورة مستقلة، وتُقرَّب للأعلى لوحدها.</p>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <ReadingField
          label="سابق"
          value={meter.previous}
          invalid={invalid}
          onChange={(previous) => onPatch({ previous })}
        />
        <ReadingField
          label="حالي"
          value={meter.current}
          invalid={invalid}
          onChange={(current) => onPatch({ current })}
        />
      </div>
      {row.issue ? <p className="mt-2 text-sm text-danger">{readingIssueLabel(row.issue)}</p> : null}
      {row.adoptedWatts !== null ? (
        <p className="mt-2 text-sm text-fg">
          استهلاك العداد {formatConsumption(row.adoptedWatts)}
          {row.rawWatts !== null && row.rawWatts !== row.adoptedWatts
            ? ` · فرق العداد ${formatConsumption(row.rawWatts)}`
            : ""}
        </p>
      ) : null}

      <div className="mt-4 space-y-2">
        {meter.allocations.map((allocation) => {
          const evalRow = row.allocations.find((item) => item.id === allocation.id);
          return (
            <div key={allocation.id} className="rounded-2xl bg-bg p-2">
              <div className="flex items-center gap-2">
                <input
                  value={allocation.name}
                  aria-label="اسم صاحب الحصة"
                  placeholder="الاسم"
                  onChange={(event) => onPatchAllocation(allocation.id, { name: event.target.value })}
                  className="h-12 min-w-0 flex-1 rounded-xl bg-surface px-3 outline-none focus:ring-2 focus:ring-primary/40"
                />
                <input
                  dir="ltr"
                  inputMode="decimal"
                  value={allocation.percent}
                  aria-label="النسبة المئوية"
                  placeholder="٪"
                  onChange={(event) => onPatchAllocation(allocation.id, { percent: event.target.value })}
                  className="h-12 w-20 rounded-xl bg-surface px-3 text-left tabular-nums outline-none focus:ring-2 focus:ring-primary/40"
                />
                <IconButton aria-label="حذف الحصة" onClick={() => onRemoveAllocation(allocation.id)}>
                  <Trash2 className="size-4" />
                </IconButton>
              </div>
              {evalRow?.watts !== null && evalRow?.watts !== undefined && evalRow.cost !== null ? (
                <p className="px-1 pt-1 text-sm text-muted">
                  {formatConsumption(evalRow.watts)} · {formatMoney(evalRow.cost)}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="ghost" className="h-11 px-2" onClick={onAddAllocation}>
          <Plus className="size-4" />
          إضافة شخص
        </Button>
        <Button variant="ghost" className="h-11 px-2" onClick={onEqualize}>
          توزيع متساوٍ
        </Button>
      </div>
      {row.cost !== null ? (
        <p className="mt-3 text-base font-semibold text-primary">مجموع الحصص {formatMoney(row.cost)}</p>
      ) : null}
    </article>
  );
}
