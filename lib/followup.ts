/**
 * متابعة ملف الشهر (طلب علي 2026-11-14): لكل ملف شهري من المسؤول —
 * مين انزار ومين لا، مين مرحّل من ملف الشهر السابق، مين متأخر من الشهر السابق بدون توصية،
 * نسبة الإنجاز ومقارنتها بالشهر السابق، وتوزيعها حسب المنطقة والسفير والتوصية.
 * الزيارة بتنحسب للخط إذا تاريخها داخل الشهر نفسه (ومش محذوفة).
 */
import { prisma as defaultPrisma, type Db } from "./db";

export const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export function prevMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  return { gte: new Date(Date.UTC(y, m - 1, 1)), lt: new Date(Date.UTC(y, m, 1)) };
}

export interface FollowupLine {
  lineId: string;
  code: string;
  codeKey: string;
  accountName: string | null;
  region: string | null;
  teamNote: string | null;
  carried: boolean; // كان بملف الشهر السابق كمان
  visit: {
    id: string;
    visitedOn: Date | null;
    owner: string | null;
    recommendation: string | null;
    color: string | null;
  } | null;
}

export interface Breakdown {
  key: string;
  total: number;
  visited: number;
}

export interface MonthFollowup {
  month: string;
  previous: string;
  hasPrevious: boolean;
  total: number; // الخطوط المطلوبة (بدون المستثناة)
  excluded: number;
  visited: number;
  pending: number;
  rate: number; // 0..100
  carried: number;
  previousRate: number | null;
  previousTotal: number | null;
  /** خطوط ملف الشهر السابق اللي ما انزارت فيه ولا أخذت توصية */
  overdue: Array<FollowupLine & { resolvedThisMonth: boolean }>;
  lines: FollowupLine[];
  byRegion: Breakdown[];
  byAmbassador: Array<{ key: string; visits: number }>;
  byRecommendation: Array<{ key: string; color: string | null; count: number }>;
}

async function monthLines(db: Db, month: string, carriedKeys: Set<string> | null) {
  const targets = await db.monthTarget.findMany({
    where: { month },
    include: { line: { select: { id: true, code: true, codeKey: true, accountName: true, region: true } } },
  });
  const active = targets.filter((t) => !t.excluded);
  const keys = active.map((t) => t.line.codeKey);
  const visits = keys.length
    ? await db.visit.findMany({
        where: { deletedAt: null, lineCodeKey: { in: keys }, visitedOn: monthRange(month) },
        select: {
          id: true,
          lineCodeKey: true,
          visitedOn: true,
          createdAt: true,
          owner: { select: { displayName: true } },
          recommendation: { select: { label: true, color: true } },
        },
        orderBy: [{ visitedOn: "desc" }, { createdAt: "desc" }],
      })
    : [];
  const latest = new Map<string, (typeof visits)[number]>();
  for (const v of visits) if (v.lineCodeKey && !latest.has(v.lineCodeKey)) latest.set(v.lineCodeKey, v);
  const lines: FollowupLine[] = active.map((t) => {
    const v = latest.get(t.line.codeKey);
    return {
      lineId: t.line.id,
      code: t.line.code,
      codeKey: t.line.codeKey,
      accountName: t.line.accountName,
      region: t.region ?? t.line.region,
      teamNote: t.teamNote,
      carried: carriedKeys?.has(t.line.codeKey) ?? false,
      visit: v
        ? {
            id: v.id,
            visitedOn: v.visitedOn,
            owner: v.owner?.displayName ?? null,
            recommendation: v.recommendation?.label ?? null,
            color: v.recommendation?.color ?? null,
          }
        : null,
    };
  });
  return { lines, excluded: targets.length - active.length, visits };
}

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);

export async function monthFollowup(month: string, db: Db = defaultPrisma): Promise<MonthFollowup> {
  const previous = prevMonth(month);
  const prev = await monthLines(db, previous, null);
  const prevKeys = new Set(prev.lines.map((l) => l.codeKey));
  const cur = await monthLines(db, month, prevKeys);

  const visited = cur.lines.filter((l) => l.visit).length;
  const prevVisited = prev.lines.filter((l) => l.visit).length;

  // متأخر من الشهر السابق: ما انزار فيه، أو انزار بدون توصية
  const overdueBase = prev.lines.filter((l) => !l.visit || !l.visit.recommendation);
  const curByKey = new Map(cur.lines.map((l) => [l.codeKey, l]));
  let resolvedVisits = new Map<string, FollowupLine["visit"]>();
  const notInCur = overdueBase.filter((l) => !curByKey.has(l.codeKey)).map((l) => l.codeKey);
  if (notInCur.length) {
    const vs = await db.visit.findMany({
      where: { deletedAt: null, lineCodeKey: { in: notInCur }, visitedOn: monthRange(month) },
      select: {
        id: true,
        lineCodeKey: true,
        visitedOn: true,
        owner: { select: { displayName: true } },
        recommendation: { select: { label: true, color: true } },
      },
      orderBy: { visitedOn: "desc" },
    });
    resolvedVisits = new Map();
    for (const v of vs)
      if (v.lineCodeKey && !resolvedVisits.has(v.lineCodeKey))
        resolvedVisits.set(v.lineCodeKey, {
          id: v.id,
          visitedOn: v.visitedOn,
          owner: v.owner?.displayName ?? null,
          recommendation: v.recommendation?.label ?? null,
          color: v.recommendation?.color ?? null,
        });
  }
  const overdue = overdueBase.map((l) => {
    const now = curByKey.get(l.codeKey)?.visit ?? resolvedVisits.get(l.codeKey) ?? null;
    return { ...l, visit: now, resolvedThisMonth: !!now };
  });

  const regions = new Map<string, Breakdown>();
  for (const l of cur.lines) {
    const key = l.region ?? "بدون منطقة";
    const r = regions.get(key) ?? { key, total: 0, visited: 0 };
    r.total++;
    if (l.visit) r.visited++;
    regions.set(key, r);
  }
  const amb = new Map<string, number>();
  const recs = new Map<string, { key: string; color: string | null; count: number }>();
  for (const l of cur.lines) {
    if (!l.visit) continue;
    const a = l.visit.owner ?? "غير محدد";
    amb.set(a, (amb.get(a) ?? 0) + 1);
    const rk = l.visit.recommendation ?? "بدون توصية";
    const r = recs.get(rk) ?? { key: rk, color: l.visit.color, count: 0 };
    r.count++;
    recs.set(rk, r);
  }

  return {
    month,
    previous,
    hasPrevious: prev.lines.length > 0,
    total: cur.lines.length,
    excluded: cur.excluded,
    visited,
    pending: cur.lines.length - visited,
    rate: pct(visited, cur.lines.length),
    carried: cur.lines.filter((l) => l.carried).length,
    previousRate: prev.lines.length ? pct(prevVisited, prev.lines.length) : null,
    previousTotal: prev.lines.length || null,
    overdue,
    lines: cur.lines,
    byRegion: [...regions.values()].sort((a, b) => b.total - a.total),
    byAmbassador: [...amb.entries()].map(([key, visits]) => ({ key, visits })).sort((a, b) => b.visits - a.visits),
    byRecommendation: [...recs.values()].sort((a, b) => b.count - a.count),
  };
}

/** الأشهر اللي إلها ملف، الأحدث أول */
export async function followupMonths(db: Db = defaultPrisma): Promise<string[]> {
  const rows = await db.monthTarget.findMany({
    distinct: ["month"],
    select: { month: true },
    orderBy: { month: "desc" },
  });
  return rows.map((r) => r.month);
}
