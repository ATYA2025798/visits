/**
 * عرض التواريخ والأوقات في كل النظام بصيغة موحّدة:
 *   التاريخ: يوم-شهر-سنة بأرقام لاتينية (11-9-2026)
 *   الوقت: 24 ساعة (14:05) بتوقيت فلسطين
 *   الشهر: باسمه المعتمد (نوفمبر 2026)
 */
import { TIME_ZONE } from "./dates";

const MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const DAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

const zonedParts = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  weekday: "short",
});

function parts(d: Date) {
  const p = Object.fromEntries(zonedParts.formatToParts(d).map((x) => [x.type, x.value]));
  const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday);
  return { y: Number(p.year), m: Number(p.month), d: Number(p.day), hh: p.hour, mm: p.minute, wd };
}

/**
 * التاريخ: 11-9-2026.
 * التواريخ المخزنة بدون وقت (تاريخ الزيارة) بتنقرأ كما هي، ولحظات الزمن (وقت الإدخال) بـ zoned
 */
export function fmtDate(d: Date | null | undefined, opts: { zoned?: boolean } = {}): string {
  if (!d) return "—";
  if (opts.zoned) {
    const p = parts(d);
    return `${p.d}-${p.m}-${p.y}`;
  }
  return `${d.getUTCDate()}-${d.getUTCMonth() + 1}-${d.getUTCFullYear()}`;
}

export function fmtTime(d: Date | null | undefined): string {
  if (!d) return "—";
  const p = parts(d);
  return `${p.hh}:${p.mm}`;
}

/** 14-11-2026 01:30 */
export function fmtDateTime(d: Date | null | undefined): string {
  if (!d) return "—";
  return `${fmtDate(d, { zoned: true })} ${fmtTime(d)}`;
}

/** «2026-11» ← نوفمبر 2026 */
export function fmtMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

/** «2026-09» ← سبتمبر */
export function fmtMonthShort(ym: string): string {
  return MONTHS[Number(ym.split("-")[1]) - 1];
}

/** الأربعاء 11 نوفمبر 2026 (لرأس الصفحة الرئيسية) */
export function fmtLongDate(d: Date): string {
  const p = parts(d);
  return `${DAYS[p.wd]} ${p.d} ${MONTHS[p.m - 1]} ${p.y}`;
}

/** «2026-11-05» ← 5-11-2026 (للتواريخ الجاية كنص من الـ API) */
export function fmtIsoDay(s: string | null | undefined): string {
  const m = s ? /^(\d{4})-(\d{2})-(\d{2})/.exec(s) : null;
  return m ? `${Number(m[3])}-${Number(m[2])}-${m[1]}` : "—";
}

/** وصف الزيارة للمستخدم وسجل التدقيق: «زيارة الخط X بتاريخ 5-11-2026» (بدون رقم داخلي) */
export function visitLabel(v: { lineCode?: string | null; specialCase?: boolean | null; visitedOn?: Date | null }): string {
  const who = v.specialCase || !v.lineCode ? "زيارة حالة خاصة" : `زيارة الخط ${v.lineCode}`;
  return v.visitedOn ? `${who} بتاريخ ${fmtDate(v.visitedOn)}` : who;
}
