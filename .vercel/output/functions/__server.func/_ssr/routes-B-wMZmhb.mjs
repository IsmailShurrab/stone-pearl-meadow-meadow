import { i as __toESM } from "../_runtime.mjs";
import { q as require_react, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Settings, c as Copy, i as Share2, o as Plus, r as Trash2, s as History, t as Zap } from "../_libs/lucide-react.mjs";
import { a as object, i as number, n as array, o as string, r as literal, t as _enum } from "../_libs/zod.mjs";
import { n as toast, t as Toaster } from "../_libs/sonner.mjs";
import { t as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-B-wMZmhb.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
var PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
function normalizeNumeric(input) {
	return input.trim().replace(/[٠-٩]/g, (digit) => String(ARABIC_DIGITS.indexOf(digit))).replace(/[۰-۹]/g, (digit) => String(PERSIAN_DIGITS.indexOf(digit))).replace(/٫/g, ".").replace(/,/g, ".").replace(/\s+/g, "");
}
function parseNumber(input) {
	const text = normalizeNumeric(input);
	if (!text) return { kind: "empty" };
	if (text === "." || /^\d+\.$/.test(text)) return { kind: "partial" };
	if (!/^\d+(\.\d+)?$/.test(text)) return { kind: "invalid" };
	const value = Number(text);
	if (!Number.isFinite(value) || value > 1e8) return { kind: "invalid" };
	return {
		kind: "ok",
		value
	};
}
/** Snap a meter reading to watt precision (3 decimal kWh). */
function snapReading(value) {
	return Math.round(value * 1e3) / 1e3;
}
function toWatts(reading) {
	return Math.round(reading * 1e3);
}
function kwhFromWatts(watts) {
	return Math.round(watts) / 1e3;
}
function roundWatts(watts, mode) {
	if (mode === "exact" || watts === 0) return watts;
	const step = mode === "w50" ? 50 : 100;
	return Math.round(watts / step) * step;
}
/** Ceiling to a whole shekel. Exact integers are unchanged. */
function ceilShekel(amount) {
	if (!Number.isFinite(amount)) return 0;
	const micro = Math.round(amount * 1e6);
	const negative = micro < 0;
	const abs = Math.abs(micro);
	const whole = Math.floor(abs / 1e6);
	const ceiled = abs % 1e6 === 0 ? whole : whole + 1;
	return negative ? -ceiled : ceiled;
}
function costFromWatts(watts, pricePerKwh) {
	return ceilShekel(watts / 1e3 * pricePerKwh);
}
function formatReading(value) {
	return snapReading(value).toFixed(3);
}
/** Consumption as people say it: watts under 1 kWh, otherwise trimmed kWh. */
function formatConsumption(watts) {
	const rounded = Math.round(watts);
	if (Math.abs(rounded) < 1e3) return `${rounded} واط`;
	return `${(rounded / 1e3).toFixed(3).replace(/0+$/, "").replace(/\.$/, "")} كيلو`;
}
function formatTableKwh(watts, mode) {
	const digits = mode === "exact" ? 3 : 2;
	return (Math.round(watts) / 1e3).toFixed(digits);
}
function formatTotalKwh(watts) {
	return `${(Math.round(watts) / 1e3).toFixed(3).replace(/0+$/, "").replace(/\.$/, "") || "0"} كيلو`;
}
function formatMoney(cost) {
	return `${cost} شيكل`;
}
function formatPrice(price) {
	return price.toFixed(4).replace(/0+$/, "").replace(/\.$/, "") || "0";
}
function roundingLabel(mode) {
	if (mode === "exact") return "قراءة دقيقة";
	if (mode === "w50") return "أقرب 50 واط";
	return "أقرب 100 واط";
}
/** Largest-remainder split so shares add up to the adopted watts. */
function splitWatts(totalWatts, percents) {
	if (percents.length === 0) return [];
	const total = Math.round(totalWatts);
	const exact = percents.map((percent) => total * percent / 100);
	const base = exact.map((value) => Math.floor(value + 1e-9));
	let leftover = total - base.reduce((sum, value) => sum + value, 0);
	const order = exact.map((value, index) => ({
		index,
		frac: value - Math.floor(value + 1e-9)
	})).sort((a, b) => b.frac - a.frac || a.index - b.index);
	if (leftover > 0) {
		let cursor = 0;
		while (leftover > 0) {
			base[order[cursor % order.length].index] += 1;
			leftover -= 1;
			cursor += 1;
		}
	} else if (leftover < 0) {
		const reverse = [...order].reverse();
		for (const item of reverse) {
			while (leftover < 0 && base[item.index] > 0) {
				base[item.index] -= 1;
				leftover += 1;
			}
			if (leftover >= 0) break;
		}
	}
	return base;
}
var nonNeg = number().min(0);
var intNonNeg = number().int().min(0);
var roundingSchema = _enum([
	"exact",
	"w50",
	"w100"
]);
var splitSchema = object({
	id: string().min(1),
	name: string(),
	kwh: string()
});
var subscriberSchema = object({
	id: string().min(1),
	name: string(),
	previous: string(),
	current: string(),
	splits: array(splitSchema).max(30)
});
var allocationSchema = object({
	id: string().min(1),
	name: string(),
	percent: string()
});
var sharedMeterSchema = object({
	id: string().min(1),
	name: string(),
	previous: string(),
	current: string(),
	allocations: array(allocationSchema).max(30)
});
var invoiceSubscriberSchema = object({
	name: string(),
	previous: nonNeg,
	current: nonNeg,
	rawKwh: nonNeg,
	adoptedKwh: nonNeg,
	cost: intNonNeg,
	splits: array(object({
		name: string(),
		kwh: nonNeg
	})).max(30)
});
var invoiceSharedSchema = object({
	name: string(),
	previous: nonNeg,
	current: nonNeg,
	rawKwh: nonNeg,
	adoptedKwh: nonNeg,
	cost: intNonNeg,
	allocations: array(object({
		name: string(),
		percent: nonNeg,
		kwh: nonNeg,
		cost: intNonNeg
	})).max(30)
});
var invoiceSchema = object({
	id: string().min(1),
	createdAt: string().min(1),
	pricePerKwh: number().positive(),
	rounding: roundingSchema,
	subscribers: array(invoiceSubscriberSchema).max(200),
	sharedMeters: array(invoiceSharedSchema).max(50),
	totalKwh: nonNeg,
	totalCost: intNonNeg
});
var ledgerSchema = object({
	version: literal(1),
	settings: object({
		pricePerKwh: number().positive().max(1e6),
		rounding: roundingSchema
	}),
	subscribers: array(subscriberSchema).max(200),
	sharedMeters: array(sharedMeterSchema).max(50),
	history: array(invoiceSchema).max(500)
});
function uid() {
	return crypto.randomUUID();
}
function sampleLedger() {
	return {
		version: 1,
		settings: {
			pricePerKwh: 35,
			rounding: "w50"
		},
		subscribers: [
			{
				id: "sub-abdo",
				name: "عبدو",
				previous: "46671.900",
				current: "46673.800",
				splits: []
			},
			{
				id: "sub-moh",
				name: "محمد",
				previous: "3089.200",
				current: "3092.300",
				splits: [{
					id: "sp-ismail",
					name: "إسماعيل",
					kwh: "2.6"
				}, {
					id: "sp-hawzi",
					name: "حوزي",
					kwh: "0.5"
				}]
			},
			{
				id: "sub-khalil",
				name: "خليل",
				previous: "4959.661",
				current: "4960.353",
				splits: []
			},
			{
				id: "sub-anas",
				name: "أبو أنس",
				previous: "80.260",
				current: "81",
				splits: []
			}
		],
		sharedMeters: [],
		history: []
	};
}
function emptyLedger() {
	return {
		version: 1,
		settings: {
			pricePerKwh: 35,
			rounding: "w50"
		},
		subscribers: [],
		sharedMeters: [],
		history: []
	};
}
function blankSubscriber() {
	return {
		id: uid(),
		name: "",
		previous: "",
		current: "",
		splits: []
	};
}
function blankSplit() {
	return {
		id: uid(),
		name: "",
		kwh: ""
	};
}
function blankSharedMeter() {
	return {
		id: uid(),
		name: "",
		previous: "",
		current: "",
		allocations: [blankAllocation("50"), blankAllocation("50")]
	};
}
function blankAllocation(percent = "") {
	return {
		id: uid(),
		name: "",
		percent
	};
}
function equalPercentStrings(count) {
	if (count <= 0) return [];
	const base = Math.floor(1e4 / count) / 100;
	const values = Array.from({ length: count }, () => base);
	const assigned = Math.round(base * (count - 1) * 100) / 100;
	values[count - 1] = Math.round((100 - assigned) * 100) / 100;
	return values.map((value) => String(Math.round(value * 100) / 100));
}
function readingIssueLabel(issue) {
	switch (issue) {
		case "need-both": return "أدخل القراءتين";
		case "need-previous": return "أدخل القراءة السابقة";
		case "need-current": return "أدخل القراءة الحالية";
		case "partial": return "أكمل الرقم";
		case "invalid": return "رقم غير صالح";
		case "decreased": return "الحالية أصغر من السابقة";
	}
}
function classifyReadings(previous, current) {
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
		rawWatts: currWatts - prevWatts
	};
}
function parsePercent(input) {
	const parsed = parseNumber(input);
	if (parsed.kind !== "ok") return null;
	if (parsed.value < 0 || parsed.value > 100) return null;
	return Math.round(parsed.value * 100) / 100;
}
function readingMessage(name, issue, kind) {
	const who = name || (kind === "مشترك" ? "مشترك بلا اسم" : "عداد بلا اسم");
	switch (issue) {
		case "need-both":
		case "need-previous":
		case "need-current": return `أكمل قراءة ${who}`;
		case "partial": return `أكمل الرقم في قراءة ${who}`;
		case "invalid": return `قراءة ${who} غير صالحة`;
		case "decreased": return `القراءة الحالية لـ ${who} أصغر من السابقة`;
	}
}
function evalSplits(splits) {
	const issues = [];
	const ok = [];
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
		ok.push({
			name,
			watts: toWatts(parsed.value)
		});
	});
	return {
		issues,
		ok
	};
}
function evaluate(ledger) {
	const { pricePerKwh, rounding } = ledger.settings;
	const issues = [];
	let totalWatts = 0;
	let totalCost = 0;
	const subscribers = ledger.subscribers.map((subscriber) => {
		const name = subscriber.name.trim();
		const readings = classifyReadings(subscriber.previous, subscriber.current);
		const splitEval = evalSplits(subscriber.splits);
		issues.push(...splitEval.issues);
		if (!name) issues.push("أدخل اسم كل مشترك");
		if (readings.issue) issues.push(readingMessage(name, readings.issue, "مشترك"));
		const adoptedWatts = readings.issue ? null : roundWatts(readings.rawWatts, rounding);
		const cost = adoptedWatts === null ? null : costFromWatts(adoptedWatts, pricePerKwh);
		let splitWarning = null;
		if (adoptedWatts !== null && splitEval.ok.length > 0) {
			if (splitEval.ok.reduce((sum, split) => sum + split.watts, 0) !== adoptedWatts) splitWarning = "مجموع التوزيع لا يساوي الاستهلاك المعتمد";
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
			splitWarning
		};
	});
	const shared = ledger.sharedMeters.map((meter) => {
		const name = meter.name.trim();
		const readings = classifyReadings(meter.previous, meter.current);
		if (!name) issues.push("أدخل اسم العداد المشترك");
		if (readings.issue) issues.push(readingMessage(name, readings.issue, "عداد"));
		const adoptedWatts = readings.issue ? null : roundWatts(readings.rawWatts, rounding);
		let percentsOk = meter.allocations.length > 0;
		if (meter.allocations.length === 0) issues.push(`أضف أشخاصاً على العداد ${name || "المشترك"}`);
		const parsedPercents = [];
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
		const percentValues = parsedPercents.filter((value) => value !== null);
		const percentSum = percentsOk && percentValues.length === meter.allocations.length ? Math.round(percentValues.reduce((sum, value) => sum + value, 0) * 100) / 100 : null;
		if (percentSum !== null && percentSum !== 100) {
			percentsOk = false;
			issues.push(`نسب عداد ${name || "مشترك"} مجموعها ${percentSum}٪ ويجب أن تساوي 100٪`);
		}
		let allocations = meter.allocations.map((allocation, index) => ({
			id: allocation.id,
			name: allocation.name.trim(),
			percent: parsedPercents[index] ?? null,
			watts: null,
			cost: null
		}));
		let cost = null;
		if (adoptedWatts !== null && percentsOk && percentSum === 100) {
			const shares = splitWatts(adoptedWatts, allocations.map((allocation) => allocation.percent ?? 0));
			allocations = allocations.map((allocation, index) => {
				const watts = shares[index] ?? 0;
				return {
					...allocation,
					watts,
					cost: costFromWatts(watts, pricePerKwh)
				};
			});
			cost = allocations.reduce((sum, allocation) => sum + (allocation.cost ?? 0), 0);
		}
		const ready = readings.issue === null && Boolean(name) && percentsOk && percentSum === 100 && adoptedWatts !== null && cost !== null && allocations.every((allocation) => allocation.name && allocation.cost !== null);
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
			cost: ready ? cost : null
		};
	});
	if (ledger.subscribers.length === 0 && ledger.sharedMeters.length === 0) issues.unshift("أضف مشتركاً أو عداداً مشتركاً أولاً");
	const uniqueIssues = [...new Set(issues)];
	return {
		subscribers,
		shared,
		totalWatts,
		totalCost,
		canClose: uniqueIssues.length === 0,
		issues: uniqueIssues
	};
}
function committedReading(input) {
	const parsed = parseNumber(input);
	if (parsed.kind !== "ok") return formatReading(0);
	return formatReading(parsed.value);
}
function closeWeek(ledger, now = /* @__PURE__ */ new Date()) {
	const view = evaluate(ledger);
	if (!view.canClose) return {
		ok: false,
		message: view.issues[0] ?? "لا يمكن إنشاء الفاتورة"
	};
	const invoice = {
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
				kwh: kwhFromWatts(split.watts)
			}))
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
				cost: allocation.cost ?? 0
			}))
		})),
		totalKwh: kwhFromWatts(view.totalWatts),
		totalCost: view.totalCost
	};
	const next = {
		version: 1,
		settings: {
			pricePerKwh: ledger.settings.pricePerKwh,
			rounding: ledger.settings.rounding
		},
		subscribers: ledger.subscribers.map((subscriber) => ({
			id: subscriber.id,
			name: subscriber.name,
			previous: committedReading(subscriber.current),
			current: "",
			splits: subscriber.splits.filter((split) => split.name.trim() || split.kwh.trim()).map((split) => ({
				...split,
				kwh: ""
			}))
		})),
		sharedMeters: ledger.sharedMeters.map((meter) => ({
			...meter,
			previous: committedReading(meter.current),
			current: "",
			allocations: meter.allocations.map((allocation) => ({ ...allocation }))
		})),
		history: [structuredClone(invoice), ...ledger.history.map((item) => structuredClone(item))]
	};
	const checked = ledgerSchema.safeParse(next);
	if (!checked.success) return {
		ok: false,
		message: "تعذر تجهيز الفاتورة للحفظ."
	};
	return {
		ok: true,
		ledger: checked.data,
		invoice: checked.data.history[0]
	};
}
function formatArabicDate(iso) {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return iso;
	return new Intl.DateTimeFormat("ar", {
		day: "numeric",
		month: "long",
		year: "numeric",
		numberingSystem: "latn"
	}).format(date);
}
function render(options) {
	const lines = ["فاتورة الكهرباء", options.dateLabel];
	if (options.draft) lines.push("مسودة — لم تُحفظ كفاتورة بعد");
	lines.push(`سعر الكيلو: ${formatPrice(options.price)} شيكل`, `التقريب: ${roundingLabel(options.rounding)}`, "");
	options.blocks.forEach((block, index) => {
		if (index > 0) lines.push("");
		const prefix = block.shared ? `عداد ${block.title}` : block.title;
		lines.push(`${prefix} سابق: ${formatReading(block.previous)} كيلو`, `${prefix} حاليا: ${formatReading(block.current)} كيلو`, `الاستهلاك: ${formatConsumption(block.adoptedWatts)}`);
		for (const split of block.splits) lines.push(`تكلفة ${split.name}: ${formatConsumption(split.watts)}`);
		for (const person of block.people) lines.push(`${person.name}: ${formatConsumption(person.watts)} — ${person.cost} شيكل`);
		if (block.cost !== null) lines.push(`الإجمالي: ${block.cost} شيكل`);
	});
	lines.push("", `المجموع: ${formatTotalKwh(options.totalWatts)}`, `المبلغ: ${options.totalCost} شيكل`);
	return lines.join("\n");
}
function reportFromInvoice(invoice) {
	const blocks = [...invoice.subscribers.map((subscriber) => ({
		title: subscriber.name,
		previous: subscriber.previous,
		current: subscriber.current,
		adoptedWatts: toWatts(subscriber.adoptedKwh),
		cost: subscriber.cost,
		splits: subscriber.splits.map((split) => ({
			name: split.name,
			watts: toWatts(split.kwh)
		})),
		people: [],
		shared: false
	})), ...invoice.sharedMeters.map((meter) => ({
		title: meter.name,
		previous: meter.previous,
		current: meter.current,
		adoptedWatts: toWatts(meter.adoptedKwh),
		cost: meter.cost,
		splits: [],
		people: meter.allocations.map((allocation) => ({
			name: allocation.name,
			watts: toWatts(allocation.kwh),
			cost: allocation.cost
		})),
		shared: true
	}))];
	return render({
		dateLabel: formatArabicDate(invoice.createdAt),
		price: invoice.pricePerKwh,
		rounding: invoice.rounding,
		draft: false,
		blocks,
		totalWatts: toWatts(invoice.totalKwh),
		totalCost: invoice.totalCost
	});
}
function reportFromLedger(ledger, view, now = /* @__PURE__ */ new Date()) {
	const blocks = [];
	view.subscribers.forEach((subscriber) => {
		if (subscriber.issue || !subscriber.name || subscriber.previous === null || subscriber.current === null || subscriber.adoptedWatts === null || subscriber.cost === null) return;
		blocks.push({
			title: subscriber.name,
			previous: subscriber.previous,
			current: subscriber.current,
			adoptedWatts: subscriber.adoptedWatts,
			cost: subscriber.cost,
			splits: subscriber.splits,
			people: [],
			shared: false
		});
	});
	view.shared.forEach((meter) => {
		if (meter.issue || !meter.name || meter.previous === null || meter.current === null || meter.adoptedWatts === null || meter.cost === null) return;
		blocks.push({
			title: meter.name,
			previous: meter.previous,
			current: meter.current,
			adoptedWatts: meter.adoptedWatts,
			cost: meter.cost,
			splits: [],
			people: meter.allocations.flatMap((allocation) => allocation.watts === null || allocation.cost === null || !allocation.name ? [] : [{
				name: allocation.name,
				watts: allocation.watts,
				cost: allocation.cost
			}]),
			shared: true
		});
	});
	return render({
		dateLabel: formatArabicDate(now.toISOString()),
		price: ledger.settings.pricePerKwh,
		rounding: ledger.settings.rounding,
		draft: !view.canClose,
		blocks,
		totalWatts: view.totalWatts,
		totalCost: view.totalCost
	});
}
var LEDGER_KEY = "electricity-ledger-v1";
var LEDGER_TMP_KEY = "electricity-ledger-v1.tmp";
function parseLedgerJson(text) {
	let data;
	try {
		data = JSON.parse(text);
	} catch {
		return {
			ok: false,
			message: "تعذر قراءة الملف. تأكد أنه ملف JSON سليم."
		};
	}
	const parsed = ledgerSchema.safeParse(data);
	if (!parsed.success) return {
		ok: false,
		message: "الملف لا يطابق بيانات حاسبة الكهرباء. تأكد أنه نسخة احتياطية من هذا التطبيق."
	};
	return {
		ok: true,
		ledger: parsed.data
	};
}
function serializeLedger(ledger) {
	return JSON.stringify(ledger, null, 2);
}
function loadLedger(kv) {
	const main = kv.getItem(LEDGER_KEY);
	const tmp = kv.getItem(LEDGER_TMP_KEY);
	if (main) {
		const parsed = parseLedgerJson(main);
		if (parsed.ok) return {
			kind: "loaded",
			ledger: parsed.ledger
		};
	}
	if (tmp) {
		const parsed = parseLedgerJson(tmp);
		if (parsed.ok) return {
			kind: "recovered",
			ledger: parsed.ledger
		};
	}
	const raw = main || tmp;
	if (raw) return {
		kind: "corrupt",
		message: "تعذر فتح البيانات المحفوظة على هذا الجهاز.",
		raw
	};
	return { kind: "empty" };
}
/** Write the temp payload first, then replace the main key, then drop the temp. */
function saveLedger(kv, ledger) {
	const json = JSON.stringify(ledger);
	kv.setItem(LEDGER_TMP_KEY, json);
	kv.setItem(LEDGER_KEY, json);
	kv.removeItem(LEDGER_TMP_KEY);
}
function androidLedger() {
	if (typeof window === "undefined") return null;
	const bridge = window.AndroidLedger;
	if (!bridge || typeof bridge.storageLoad !== "function" || typeof bridge.storageSave !== "function") return null;
	return bridge;
}
function loadAndroidLedger(text) {
	if (!text.trim()) return { kind: "empty" };
	const parsed = parseLedgerJson(text);
	if (!parsed.ok) return {
		kind: "corrupt",
		message: parsed.message,
		raw: text
	};
	return {
		kind: "loaded",
		ledger: parsed.ledger
	};
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function Button({ variant = "quiet", className, type = "button", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type,
		className: cn("inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-4 text-base font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50", variant === "primary" && "bg-primary text-primary-fg hover:bg-primary/90", variant === "quiet" && "border border-border bg-surface text-fg hover:bg-ok-soft", variant === "danger" && "bg-danger-soft text-danger", variant === "ghost" && "bg-transparent text-muted hover:bg-surface hover:text-fg", className),
		...props
	});
}
function IconButton({ className, type = "button", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type,
		className: cn("grid size-11 shrink-0 place-items-center rounded-2xl text-muted transition-colors hover:bg-danger-soft hover:text-danger", className),
		...props
	});
}
function Sheet({ open, title, children, onClose }) {
	(0, import_react.useEffect)(() => {
		if (!open) return;
		const onKey = (event) => {
			if (event.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open, onClose]);
	if (!open) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-end justify-center bg-fg/40 p-3 sm:items-center",
		onClick: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			role: "dialog",
			"aria-modal": "true",
			"aria-label": title,
			className: "max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-surface p-5",
			onClick: (event) => event.stopPropagation(),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-xl font-semibold text-fg",
				children: title
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3",
				children
			})]
		})
	});
}
function ReadingField({ label, value, onChange, invalid }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block min-w-0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mb-1 block text-sm text-muted",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			dir: "ltr",
			inputMode: "decimal",
			autoComplete: "off",
			value,
			placeholder: "0.000",
			onChange: (event) => onChange(event.target.value),
			className: cn("h-14 w-full rounded-2xl border bg-bg px-3 text-left text-2xl font-medium text-fg tabular-nums outline-none focus:border-primary", invalid ? "border-danger" : "border-border")
		})]
	});
}
function SubscriberCard({ subscriber, row, onPatch, onRemove, onAddSplit, onPatchSplit, onRemoveSplit }) {
	const [askDelete, setAskDelete] = (0, import_react.useState)(false);
	const [splitsOpen, setSplitsOpen] = (0, import_react.useState)(subscriber.splits.length > 0);
	const invalid = row.issue === "invalid" || row.issue === "decreased" || row.issue === "partial";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		id: `sub-${subscriber.id}`,
		className: "rounded-3xl border border-border bg-surface p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: subscriber.name,
					"aria-label": "اسم المشترك",
					placeholder: "اسم المشترك",
					onChange: (event) => onPatch({ name: event.target.value }),
					className: "h-11 min-w-0 flex-1 bg-transparent text-xl font-semibold text-fg outline-none placeholder:text-muted/70"
				}), askDelete ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "danger",
						className: "h-11 px-3",
						onClick: onRemove,
						children: "حذف"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						className: "h-11 px-3",
						onClick: () => setAskDelete(false),
						children: "إلغاء"
					})]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconButton, {
					"aria-label": `حذف ${subscriber.name || "المشترك"}`,
					onClick: () => setAskDelete(true),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-5" })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 grid grid-cols-2 gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReadingField, {
					label: "سابق",
					value: subscriber.previous,
					invalid,
					onChange: (previous) => onPatch({ previous })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReadingField, {
					label: "حالي",
					value: subscriber.current,
					invalid,
					onChange: (current) => onPatch({ current })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "الاستهلاك المعتمد"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-xl font-semibold tabular-nums text-fg",
					children: row.adoptedWatts === null ? "—" : formatConsumption(row.adoptedWatts)
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "التكلفة"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-xl font-semibold tabular-nums text-primary",
					children: row.cost === null ? "—" : formatMoney(row.cost)
				})] })]
			}),
			row.issue ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-danger",
				children: readingIssueLabel(row.issue)
			}) : null,
			row.rawWatts !== null && row.adoptedWatts !== null && row.rawWatts !== row.adoptedWatts ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-sm text-warn",
				children: [
					"فرق العداد ",
					formatConsumption(row.rawWatts),
					" · بعد التقريب ",
					formatConsumption(row.adoptedWatts)
				]
			}) : null,
			row.splitWarning ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-warn",
				children: row.splitWarning
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "mt-3 text-sm font-medium text-primary",
				onClick: () => setSplitsOpen((open) => !open),
				"aria-expanded": splitsOpen,
				children: [splitsOpen ? "إخفاء التوزيع" : "توزيع في التقرير", subscriber.splits.length > 0 ? ` (${subscriber.splits.length})` : ""]
			}),
			splitsOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 space-y-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "يظهر في التقرير فقط، ولا يُضاف فوق استهلاك العداد."
					}),
					subscriber.splits.map((split) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: split.name,
								"aria-label": "اسم الشخص في التوزيع",
								placeholder: "الاسم",
								onChange: (event) => onPatchSplit(split.id, { name: event.target.value }),
								className: "h-12 min-w-0 flex-1 rounded-2xl border border-border bg-bg px-3 text-fg outline-none focus:border-primary"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								dir: "ltr",
								inputMode: "decimal",
								value: split.kwh,
								"aria-label": "كمية التوزيع بالكيلو",
								placeholder: "كيلو",
								onChange: (event) => onPatchSplit(split.id, { kwh: event.target.value }),
								className: "h-12 w-24 rounded-2xl border border-border bg-bg px-3 text-left tabular-nums outline-none focus:border-primary"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconButton, {
								"aria-label": "حذف بند التوزيع",
								onClick: () => onRemoveSplit(split.id),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
							})
						]
					}, split.id)),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "ghost",
						className: "h-11 px-2",
						onClick: onAddSplit,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), "إضافة شخص"]
					})
				]
			}) : null
		]
	});
}
function SharedMeterCard({ meter, row, onPatch, onRemove, onAddAllocation, onPatchAllocation, onRemoveAllocation, onEqualize }) {
	const [askDelete, setAskDelete] = (0, import_react.useState)(false);
	const invalid = row.issue === "invalid" || row.issue === "decreased" || row.issue === "partial";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		id: `meter-${meter.id}`,
		className: "rounded-3xl border border-primary/30 bg-surface p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-2 flex items-center justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "rounded-full bg-ok-soft px-3 py-1 text-sm font-medium text-primary",
					children: "عداد مشترك"
				}), askDelete ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "danger",
						className: "h-11 px-3",
						onClick: onRemove,
						children: "حذف"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						className: "h-11 px-3",
						onClick: () => setAskDelete(false),
						children: "إلغاء"
					})]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconButton, {
					"aria-label": "حذف العداد المشترك",
					onClick: () => setAskDelete(true),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-5" })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				value: meter.name,
				"aria-label": "اسم العداد المشترك",
				placeholder: "اسم العداد",
				onChange: (event) => onPatch({ name: event.target.value }),
				className: "h-11 w-full bg-transparent text-xl font-semibold text-fg outline-none placeholder:text-muted/70"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted",
				children: "كل حصة فاتورة مستقلة، وتُقرَّب للأعلى لوحدها."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 grid grid-cols-2 gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReadingField, {
					label: "سابق",
					value: meter.previous,
					invalid,
					onChange: (previous) => onPatch({ previous })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReadingField, {
					label: "حالي",
					value: meter.current,
					invalid,
					onChange: (current) => onPatch({ current })
				})]
			}),
			row.issue ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-danger",
				children: readingIssueLabel(row.issue)
			}) : null,
			row.adoptedWatts !== null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-sm text-fg",
				children: [
					"استهلاك العداد ",
					formatConsumption(row.adoptedWatts),
					row.rawWatts !== null && row.rawWatts !== row.adoptedWatts ? ` · فرق العداد ${formatConsumption(row.rawWatts)}` : ""
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 space-y-2",
				children: meter.allocations.map((allocation) => {
					const evalRow = row.allocations.find((item) => item.id === allocation.id);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl bg-bg p-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									value: allocation.name,
									"aria-label": "اسم صاحب الحصة",
									placeholder: "الاسم",
									onChange: (event) => onPatchAllocation(allocation.id, { name: event.target.value }),
									className: "h-12 min-w-0 flex-1 rounded-xl bg-surface px-3 outline-none focus:ring-2 focus:ring-primary/40"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									dir: "ltr",
									inputMode: "decimal",
									value: allocation.percent,
									"aria-label": "النسبة المئوية",
									placeholder: "٪",
									onChange: (event) => onPatchAllocation(allocation.id, { percent: event.target.value }),
									className: "h-12 w-20 rounded-xl bg-surface px-3 text-left tabular-nums outline-none focus:ring-2 focus:ring-primary/40"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconButton, {
									"aria-label": "حذف الحصة",
									onClick: () => onRemoveAllocation(allocation.id),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
								})
							]
						}), evalRow?.watts !== null && evalRow?.watts !== void 0 && evalRow.cost !== null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "px-1 pt-1 text-sm text-muted",
							children: [
								formatConsumption(evalRow.watts),
								" · ",
								formatMoney(evalRow.cost)
							]
						}) : null]
					}, allocation.id);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex flex-wrap gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "ghost",
					className: "h-11 px-2",
					onClick: onAddAllocation,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), "إضافة شخص"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					className: "h-11 px-2",
					onClick: onEqualize,
					children: "توزيع متساوٍ"
				})]
			}),
			row.cost !== null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 text-base font-semibold text-primary",
				children: ["مجموع الحصص ", formatMoney(row.cost)]
			}) : null
		]
	});
}
var HINT_KEY = "electricity-sample-hint";
function downloadText(filename, text, mime) {
	const blob = new Blob([text], { type: mime });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	link.click();
	URL.revokeObjectURL(url);
}
async function copyText(text) {
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
async function shareText(text) {
	const bridge = androidLedger();
	if (bridge?.shareText) {
		bridge.shareText(text);
		return;
	}
	if (typeof navigator.share === "function") try {
		await navigator.share({
			title: "فاتورة الكهرباء",
			text
		});
		return;
	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") return;
	}
	await copyText(text);
}
function LedgerApp() {
	const [ledger, setLedger] = (0, import_react.useState)(() => sampleLedger());
	const [persist, setPersist] = (0, import_react.useState)(false);
	const [usingFile, setUsingFile] = (0, import_react.useState)(false);
	const [warning, setWarning] = (0, import_react.useState)(null);
	const [corruptRaw, setCorruptRaw] = (0, import_react.useState)(null);
	const [tab, setTab] = (0, import_react.useState)("now");
	const [hint, setHint] = (0, import_react.useState)(false);
	const [dialog, setDialog] = (0, import_react.useState)(null);
	const [invoiceId, setInvoiceId] = (0, import_react.useState)(null);
	const fileRef = (0, import_react.useRef)(null);
	const view = (0, import_react.useMemo)(() => evaluate(ledger), [ledger]);
	const draftReport = (0, import_react.useMemo)(() => reportFromLedger(ledger, view), [ledger, view]);
	(0, import_react.useEffect)(() => {
		const bridge = androidLedger();
		const apply = (result) => {
			if (result.kind === "loaded" || result.kind === "recovered") {
				setLedger(result.ledger);
				if (result.kind === "recovered") setWarning("تم استرداد آخر حفظ سليم.");
			} else if (result.kind === "corrupt") {
				setWarning(result.message);
				setCorruptRaw(result.raw);
				setPersist(false);
				return;
			} else if (typeof localStorage !== "undefined" && localStorage.getItem(HINT_KEY) !== "off") setHint(true);
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
	(0, import_react.useEffect)(() => {
		if (!persist) return;
		const bridge = androidLedger();
		if (bridge) {
			bridge.storageSave(JSON.stringify(ledger));
			return;
		}
		if (typeof localStorage === "undefined") return;
		saveLedger(localStorage, ledger);
	}, [ledger, persist]);
	(0, import_react.useEffect)(() => {
		const host = window;
		host.__electricityImport = (text) => {
			const parsed = parseLedgerJson(text);
			if (!parsed.ok) {
				setDialog({
					kind: "import-error",
					message: parsed.message
				});
				return;
			}
			setDialog({
				kind: "import",
				ledger: parsed.ledger
			});
		};
		return () => {
			delete host.__electricityImport;
		};
	}, []);
	function update(recipe) {
		setLedger((current) => recipe(current));
	}
	function patchSubscriber(id, patch) {
		update((current) => ({
			...current,
			subscribers: current.subscribers.map((subscriber) => subscriber.id === id ? {
				...subscriber,
				...patch
			} : subscriber)
		}));
	}
	function patchSplit(subscriberId, splitId, patch) {
		update((current) => ({
			...current,
			subscribers: current.subscribers.map((subscriber) => subscriber.id === subscriberId ? {
				...subscriber,
				splits: subscriber.splits.map((split) => split.id === splitId ? {
					...split,
					...patch
				} : split)
			} : subscriber)
		}));
	}
	function patchMeter(id, patch) {
		update((current) => ({
			...current,
			sharedMeters: current.sharedMeters.map((meter) => meter.id === id ? {
				...meter,
				...patch
			} : meter)
		}));
	}
	function patchAllocation(meterId, allocationId, patch) {
		update((current) => ({
			...current,
			sharedMeters: current.sharedMeters.map((meter) => meter.id === meterId ? {
				...meter,
				allocations: meter.allocations.map((allocation) => allocation.id === allocationId ? {
					...allocation,
					...patch
				} : allocation)
			} : meter)
		}));
	}
	function addSubscriber() {
		const subscriber = blankSubscriber();
		update((current) => ({
			...current,
			subscribers: [...current.subscribers, subscriber]
		}));
		setTab("now");
		requestAnimationFrame(() => {
			document.getElementById(`sub-${subscriber.id}`)?.scrollIntoView({
				behavior: "smooth",
				block: "center"
			});
		});
	}
	function addMeter() {
		const meter = blankSharedMeter();
		update((current) => ({
			...current,
			sharedMeters: [...current.sharedMeters, meter]
		}));
		setTab("now");
		requestAnimationFrame(() => {
			document.getElementById(`meter-${meter.id}`)?.scrollIntoView({
				behavior: "smooth",
				block: "center"
			});
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
		toast("حُفظت الفاتورة ورُحّلت القراءات", { action: {
			label: "تراجع",
			onClick: () => setLedger(current)
		} });
	}
	function replaceLedger(next, message) {
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
		const filename = `electricity-backup-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`;
		const bridge = androidLedger();
		if (bridge?.exportJson) {
			bridge.exportJson(filename, json);
			return;
		}
		downloadText(filename, json, "application/json;charset=utf-8");
		toast("تم تنزيل النسخة الاحتياطية");
	}
	function onImportFile(file) {
		file.text().then((text) => {
			const parsed = parseLedgerJson(text);
			if (!parsed.ok) {
				setDialog({
					kind: "import-error",
					message: parsed.message
				});
				return;
			}
			setDialog({
				kind: "import",
				ledger: parsed.ledger
			});
		});
	}
	const openInvoice = ledger.history.find((invoice) => invoice.id === invoiceId);
	const tableRows = [...view.subscribers.filter((row) => row.adoptedWatts !== null && row.cost !== null).map((row) => ({
		key: row.id,
		name: row.name || "بدون اسم",
		kwh: formatTableKwh(row.adoptedWatts ?? 0, ledger.settings.rounding),
		cost: row.cost ?? 0
	})), ...view.shared.flatMap((meter) => meter.cost === null ? [] : meter.allocations.filter((allocation) => allocation.cost !== null && allocation.watts !== null).map((allocation) => ({
		key: allocation.id,
		name: allocation.name,
		kwh: formatTableKwh(allocation.watts ?? 0, ledger.settings.rounding),
		cost: allocation.cost ?? 0
	})))];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
				position: "top-center",
				dir: "rtl"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto min-h-screen max-w-lg",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
						className: "sticky top-0 z-20 border-b border-border bg-bg/95 px-4 py-3 backdrop-blur",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "grid size-9 place-items-center rounded-2xl bg-primary text-primary-fg",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, { className: "size-4" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "text-lg font-semibold",
									children: "حاسبة الكهرباء"
								})]
							}), tab === "now" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "ghost",
									className: "size-11 px-0",
									"aria-label": "نسخ التقرير",
									onClick: () => void copyText(draftReport),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-5" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "ghost",
									className: "size-11 px-0",
									"aria-label": "مشاركة التقرير",
									onClick: () => void shareText(draftReport),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { className: "size-5" })
								})]
							}) : null]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex items-end justify-between gap-3",
							"aria-live": "polite",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted",
									children: view.canClose ? "المبلغ المستحق" : "المجموع حتى الآن"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-5xl font-semibold tabular-nums leading-none text-accent",
									children: view.totalCost
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm text-muted",
									children: "شيكل"
								})
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-end",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-lg font-medium tabular-nums",
									children: formatTotalKwh(view.totalWatts)
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-sm text-muted",
									children: [
										formatPrice(ledger.settings.pricePerKwh),
										" شيكل/كيلو · ",
										roundingLabel(ledger.settings.rounding)
									]
								})]
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
						className: tab === "now" ? "space-y-4 px-4 pt-4 pb-40" : "space-y-4 px-4 pt-4 pb-24",
						children: [
							warning ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: warning }), corruptRaw ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "mt-2 font-medium underline",
									onClick: () => downloadText("ledger-corrupt.json", corruptRaw, "application/json"),
									children: "تنزيل الملف التالف"
								}) : null]
							}) : null,
							tab === "now" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-2xl bg-warn-soft px-4 py-3 text-sm text-warn",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "هذه أرقام المثال: السعر 35 شيكل، والتقريب لأقرب 50 واط. المجموع المتوقع 228 شيكل." }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "mt-2 font-medium",
										onClick: () => {
											localStorage.setItem(HINT_KEY, "off");
											setHint(false);
										},
										children: "فهمت"
									})]
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
									className: "overflow-hidden rounded-3xl border border-border bg-surface",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
										className: "w-full text-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
											className: "text-muted",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-4 py-3 text-start font-medium",
													children: "المشترك"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-2 py-3 text-end font-medium",
													children: "الاستهلاك"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-4 py-3 text-end font-medium",
													children: "شيكل"
												})
											]
										}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [tableRows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											colSpan: 3,
											className: "px-4 py-4 text-muted",
											children: "ستظهر الأرقام بعد إدخال القراءة السابقة والحالية."
										}) }) : tableRows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
											className: "border-t border-border",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "px-4 py-3 font-medium",
													children: row.name
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "px-2 py-3 text-end tabular-nums",
													dir: "ltr",
													children: row.kwh
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "px-4 py-3 text-end font-semibold tabular-nums text-primary",
													dir: "ltr",
													children: row.cost
												})
											]
										}, row.key)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
											className: "border-t border-border bg-ok-soft",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "px-4 py-3 font-semibold",
													children: "الإجمالي"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "px-2 py-3 text-end font-semibold tabular-nums",
													dir: "ltr",
													children: formatTableKwh(view.totalWatts, ledger.settings.rounding)
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "px-4 py-3 text-end text-lg font-semibold tabular-nums text-accent",
													dir: "ltr",
													children: view.totalCost
												})
											]
										})] })]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "space-y-3",
									children: ledger.subscribers.map((subscriber) => {
										const row = view.subscribers.find((item) => item.id === subscriber.id);
										if (!row) return null;
										return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SubscriberCard, {
											subscriber,
											row,
											onPatch: (patch) => patchSubscriber(subscriber.id, patch),
											onRemove: () => update((current) => ({
												...current,
												subscribers: current.subscribers.filter((item) => item.id !== subscriber.id)
											})),
											onAddSplit: () => update((current) => ({
												...current,
												subscribers: current.subscribers.map((item) => item.id === subscriber.id ? {
													...item,
													splits: [...item.splits, blankSplit()]
												} : item)
											})),
											onPatchSplit: (splitId, patch) => patchSplit(subscriber.id, splitId, patch),
											onRemoveSplit: (splitId) => update((current) => ({
												...current,
												subscribers: current.subscribers.map((item) => item.id === subscriber.id ? {
													...item,
													splits: item.splits.filter((split) => split.id !== splitId)
												} : item)
											}))
										}, subscriber.id);
									})
								}),
								ledger.sharedMeters.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "space-y-3",
									children: ledger.sharedMeters.map((meter) => {
										const row = view.shared.find((item) => item.id === meter.id);
										if (!row) return null;
										return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SharedMeterCard, {
											meter,
											row,
											onPatch: (patch) => patchMeter(meter.id, patch),
											onRemove: () => update((current) => ({
												...current,
												sharedMeters: current.sharedMeters.filter((item) => item.id !== meter.id)
											})),
											onAddAllocation: () => update((current) => ({
												...current,
												sharedMeters: current.sharedMeters.map((item) => item.id === meter.id ? {
													...item,
													allocations: [...item.allocations, blankAllocation()]
												} : item)
											})),
											onPatchAllocation: (allocationId, patch) => patchAllocation(meter.id, allocationId, patch),
											onRemoveAllocation: (allocationId) => update((current) => ({
												...current,
												sharedMeters: current.sharedMeters.map((item) => item.id === meter.id ? {
													...item,
													allocations: item.allocations.filter((allocation) => allocation.id !== allocationId)
												} : item)
											})),
											onEqualize: () => update((current) => ({
												...current,
												sharedMeters: current.sharedMeters.map((item) => {
													if (item.id !== meter.id) return item;
													const percents = equalPercentStrings(item.allocations.length);
													return {
														...item,
														allocations: item.allocations.map((allocation, index) => ({
															...allocation,
															percent: percents[index] ?? ""
														}))
													};
												})
											}))
										}, meter.id);
									})
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										onClick: addSubscriber,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), "مشترك جديد"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										onClick: addMeter,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), "عداد مشترك"]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "mb-2 text-base font-semibold",
									children: "نص التقرير"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
									className: "ledger-lines whitespace-pre-wrap rounded-3xl border border-border px-4 py-3 font-sans text-sm text-fg",
									children: draftReport
								})] })
							] }) : null,
							tab === "history" ? openInvoice ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HistoryDetail, {
								invoice: openInvoice,
								onBack: () => setInvoiceId(null),
								onDelete: () => {
									update((current) => ({
										...current,
										history: current.history.filter((item) => item.id !== openInvoice.id)
									}));
									setInvoiceId(null);
									toast("حُذفت الفاتورة من السجل");
								}
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HistoryList, {
								invoices: ledger.history,
								onOpen: setInvoiceId
							}) : null,
							tab === "settings" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsPanel, {
								ledger,
								usingFile,
								onPrice: (pricePerKwh) => update((current) => ({
									...current,
									settings: {
										...current.settings,
										pricePerKwh
									}
								})),
								onRounding: (rounding) => update((current) => ({
									...current,
									settings: {
										...current.settings,
										rounding
									}
								})),
								onExport: exportBackup,
								onImport: () => {
									const bridge = androidLedger();
									if (bridge?.importJson) {
										bridge.importJson();
										return;
									}
									fileRef.current?.click();
								},
								onSample: () => setDialog({ kind: "sample" }),
								onReset: () => setDialog({ kind: "reset" })
							}) : null
						]
					}),
					tab === "now" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "fixed inset-x-0 bottom-16 z-30",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mx-auto max-w-lg px-4 pb-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "primary",
								className: "h-14 w-full text-lg",
								onClick: requestClose,
								children: "إنشاء فاتورة أسبوع جديد"
							})
						})
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
						className: "fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mx-auto grid max-w-lg grid-cols-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavButton, {
									active: tab === "now",
									label: "الحساب",
									onClick: () => setTab("now"),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, { className: "size-5" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavButton, {
									active: tab === "history",
									label: "السجل",
									onClick: () => setTab("history"),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(History, { className: "size-5" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavButton, {
									active: tab === "settings",
									label: "الإعدادات",
									onClick: () => setTab("settings"),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "size-5" })
								})
							]
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: fileRef,
				type: "file",
				accept: "application/json,.json",
				className: "hidden",
				onChange: (event) => {
					const file = event.target.files?.[0];
					event.target.value = "";
					if (file) onImportFile(file);
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Sheet, {
				open: dialog?.kind === "problems",
				title: "لا يمكن إقفال الأسبوع",
				onClose: () => setDialog(null),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-2 text-sm text-fg",
					children: view.issues.map((issue) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "rounded-2xl bg-danger-soft px-3 py-2 text-danger",
						children: issue
					}, issue))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "mt-4 w-full",
					onClick: () => setDialog(null),
					children: "رجوع للتعديل"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Sheet, {
				open: dialog?.kind === "close",
				title: "فاتورة أسبوع جديد",
				onClose: () => setDialog(null),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm leading-6 text-muted",
						children: "ستُحفظ الفاتورة في السجل كما هي الآن، ولن تتأثر إن غيّرت الأسماء أو السعر لاحقاً. القراءة الحالية تصبح السابقة، وتُفرَّغ خانة الحالية."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 text-3xl font-semibold tabular-nums text-accent",
						children: [
							view.totalCost,
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-base font-medium text-muted",
								children: "شيكل"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: formatTotalKwh(view.totalWatts)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 grid grid-cols-2 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							onClick: () => setDialog(null),
							children: "رجوع"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "primary",
							onClick: confirmClose,
							children: "تأكيد الحفظ"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Sheet, {
				open: dialog?.kind === "reset",
				title: "بدء دفتر فارغ؟",
				onClose: () => setDialog(null),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm leading-6 text-muted",
					children: "يُحذف المشتركون وقراءات هذا الأسبوع والسجل من هذا الجهاز. صدّر نسخة احتياطية أولاً إن كنت بحاجة إليها."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 grid grid-cols-2 gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						onClick: () => setDialog(null),
						children: "إلغاء"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "danger",
						onClick: () => replaceLedger(emptyLedger(), "بدأ دفتر جديد"),
						children: "حذف الدفتر"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Sheet, {
				open: dialog?.kind === "sample",
				title: "تحميل مثال الاختبار؟",
				onClose: () => setDialog(null),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm leading-6 text-muted",
					children: "يستبدل الدفتر الحالي بأرقام عبدو ومحمد وخليل وأبو أنس. الفواتير المحفوظة حالياً ستُحذف من الجهاز."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 grid grid-cols-2 gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						onClick: () => setDialog(null),
						children: "إلغاء"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "primary",
						onClick: () => replaceLedger(sampleLedger(), "تم تحميل المثال"),
						children: "تحميل"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
				open: dialog?.kind === "import",
				title: "استعادة النسخة الاحتياطية؟",
				onClose: () => setDialog(null),
				children: dialog?.kind === "import" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm leading-6 text-muted",
					children: [
						"الملف يحتوي على ",
						dialog.ledger.subscribers.length,
						" مشتركين و",
						dialog.ledger.sharedMeters.length,
						" عدادات مشتركة و",
						dialog.ledger.history.length,
						" فواتير. سيتم استبدال البيانات الحالية."
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 grid grid-cols-2 gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						onClick: () => setDialog(null),
						children: "إلغاء"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "primary",
						onClick: () => replaceLedger(dialog.ledger, "تمت استعادة النسخة الاحتياطية"),
						children: "استعادة"
					})]
				})] }) : null
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Sheet, {
				open: dialog?.kind === "import-error",
				title: "تعذر الاستيراد",
				onClose: () => setDialog(null),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm leading-6 text-danger",
					children: dialog?.kind === "import-error" ? dialog.message : ""
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "mt-4 w-full",
					onClick: () => setDialog(null),
					children: "حسناً"
				})]
			})
		]
	});
}
function NavButton({ active, label, onClick, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick,
		"aria-current": active ? "page" : void 0,
		className: active ? "flex h-16 flex-col items-center justify-center gap-1 text-sm font-medium text-primary" : "flex h-16 flex-col items-center justify-center gap-1 text-sm text-muted",
		children: [children, label]
	});
}
function HistoryList({ invoices, onOpen }) {
	if (invoices.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-3xl border border-border bg-surface px-4 py-8 text-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-lg font-semibold",
			children: "لا توجد فواتير بعد"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-sm leading-6 text-muted",
			children: "بعد إكمال قراءات الأسبوع، اضغط «إنشاء فاتورة أسبوع جديد» ليُحفظ الكشف وتُرحَّل القراءات."
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted",
			children: "الفواتير القديمة ثابتة ولا تتغير إذا عدّلت المشتركين لاحقاً."
		}), invoices.map((invoice) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			onClick: () => onOpen(invoice.id),
			className: "flex w-full items-center justify-between rounded-3xl border border-border bg-surface px-4 py-3 text-start",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "block font-semibold",
				children: formatArabicDate(invoice.createdAt)
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "mt-1 block text-sm text-muted",
				children: [
					formatTotalKwh(Math.round(invoice.totalKwh * 1e3)),
					" · ",
					roundingLabel(invoice.rounding)
				]
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-2xl font-semibold tabular-nums text-accent",
				children: invoice.totalCost
			})]
		}, invoice.id))]
	});
}
function HistoryDetail({ invoice, onBack, onDelete }) {
	const [ask, setAsk] = (0, import_react.useState)(false);
	const report = reportFromInvoice(invoice);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				className: "h-11 px-2",
				onClick: onBack,
				children: "رجوع إلى السجل"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-end justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-xl font-semibold",
					children: formatArabicDate(invoice.createdAt)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted",
					children: [
						formatPrice(invoice.pricePerKwh),
						" شيكل/كيلو · ",
						roundingLabel(invoice.rounding)
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-3xl font-semibold tabular-nums text-accent",
					children: formatMoney(invoice.totalCost)
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
				className: "ledger-lines whitespace-pre-wrap rounded-3xl border border-border px-4 py-3 font-sans text-sm text-fg",
				children: report
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					onClick: () => void copyText(report),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-4" }), "نسخ"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					onClick: () => void shareText(report),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { className: "size-4" }), "مشاركة"]
				})]
			}),
			ask ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					onClick: () => setAsk(false),
					children: "إلغاء"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "danger",
					onClick: onDelete,
					children: "تأكيد الحذف"
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "danger",
				className: "w-full",
				onClick: () => setAsk(true),
				children: "حذف هذه الفاتورة"
			})
		]
	});
}
function SettingsPanel({ ledger, usingFile, onPrice, onRounding, onExport, onImport, onSample, onReset }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-3xl border border-border bg-surface p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-lg font-semibold",
						children: "سعر الكيلو واط"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted",
						children: "الافتراضي 35 شيكل. تغييره لا يعدّل الفواتير المحفوظة."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PriceField, {
						price: ledger.settings.pricePerKwh,
						onCommit: onPrice
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-3xl border border-border bg-surface p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-lg font-semibold",
						children: "تقريب الاستهلاك"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm leading-6 text-muted",
						children: "التكلفة = الاستهلاك المعتمد × السعر، ثم تُقرَّب كل فاتورة للأعلى إلى أقرب شيكل. الإجمالي هو مجموع الفواتير بعد هذا التقريب."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 grid grid-cols-1 gap-2",
						children: [
							["w50", "أقرب 50 واط"],
							["w100", "أقرب 100 واط"],
							["exact", "قراءة دقيقة"]
						].map(([mode, label]) => {
							const active = ledger.settings.rounding === mode;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-pressed": active,
								onClick: () => onRounding(mode),
								className: active ? "h-12 rounded-2xl bg-primary px-4 text-start font-medium text-primary-fg" : "h-12 rounded-2xl border border-border bg-bg px-4 text-start font-medium text-fg",
								children: label
							}, mode);
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-3xl border border-border bg-surface p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-lg font-semibold",
						children: "النسخة الاحتياطية"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm leading-6 text-muted",
						children: usingFile ? "البيانات في ملف JSON داخل التطبيق، وتُكتب في ملف مؤقت ثم تُستبدل." : "البيانات تُحفظ تلقائياً على هذا الجهاز في ملف JSON محلي، وتبقى بعد إغلاق الصفحة. لا يوجد اتصال بخادم."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 grid grid-cols-2 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: onExport,
							children: "تصدير JSON"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: onImport,
							children: "استيراد JSON"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-3xl border border-border bg-surface p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-lg font-semibold",
					children: "الدفتر"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 grid grid-cols-1 gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: onSample,
						children: "تحميل مثال الاختبار"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "danger",
						onClick: onReset,
						children: "بدء دفتر فارغ"
					})]
				})]
			})
		]
	});
}
function PriceField({ price, onCommit }) {
	const ref = (0, import_react.useRef)(null);
	const [text, setText] = (0, import_react.useState)(() => formatPrice(price));
	(0, import_react.useEffect)(() => {
		if (document.activeElement !== ref.current) setText(formatPrice(price));
	}, [price]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "mt-3 block",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "sr-only",
			children: "سعر الكيلو واط بالشيكل"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			ref,
			dir: "ltr",
			inputMode: "decimal",
			value: text,
			onChange: (event) => {
				const next = event.target.value;
				setText(next);
				const parsed = parseNumber(next);
				if (parsed.kind === "ok" && parsed.value > 0 && parsed.value <= 1e6) onCommit(parsed.value);
			},
			onBlur: () => setText(formatPrice(price)),
			className: "h-14 w-full rounded-2xl border border-border bg-bg px-3 text-left text-3xl font-semibold tabular-nums outline-none focus:border-primary"
		})]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LedgerApp, {});
}
//#endregion
export { Home as component };
