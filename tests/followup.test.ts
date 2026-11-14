import { beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { monthFollowup, prevMonth, followupMonths } from "@/lib/followup";
import { prisma, resetDb, makeUser } from "./helpers";

const day = (s: string) => new Date(`${s}T00:00:00Z`);

async function line(code: string, region = "غزة") {
  const key = code.replace(/-/g, "");
  return prisma.line.create({ data: { code, codeKey: key, accountKey: key.slice(0, 5), accountName: `حساب ${code}`, region } });
}
async function target(month: string, l: { id: string }, excluded = false) {
  return prisma.monthTarget.create({ data: { month, lineId: l.id, sheet: "S", importId: randomUUID(), excluded } });
}
async function visit(l: { id: string; code: string; codeKey: string }, on: string, ownerId: string, recId: string | null) {
  return prisma.visit.create({
    data: { number: Math.floor(Math.random() * 1e6), source: "APP", lineId: l.id, lineCode: l.code, lineCodeKey: l.codeKey, visitedOn: day(on), ownerId, recommendationId: recId },
  });
}

describe("متابعة ملف الشهر", () => {
  beforeEach(resetDb);

  it("الشهر السابق يُحسب عبر حدود السنة", () => {
    expect(prevMonth("2026-12")).toBe("2026-11");
    expect(prevMonth("2027-01")).toBe("2026-12");
  });

  it("يحسب المُزار وغير المُزار والمرحّل والمتأخر ونسبة الإنجاز مقارنة بالشهر السابق", async () => {
    const amb = await makeUser("ali");
    const rec = await prisma.listItem.findFirstOrThrow({ where: { kind: "RECOMMENDATION", label: "يوجد تجاوز" } });
    const [a, b, c, d, e] = await Promise.all(["G-1000-001", "G-1000-002", "G-1000-003", "G-1000-004", "G-1000-005"].map((x) => line(x)));
    // نوفمبر: a,b,c — a انزار بتوصية، b انزار بدون توصية، c ما انزار
    for (const l of [a, b, c]) await target("2026-11", l);
    await visit(a, "2026-11-05", amb.id, rec.id);
    await visit(b, "2026-11-06", amb.id, null);
    // ديسمبر: a (مرحّل)، d، e مستثنى
    await target("2026-12", a);
    await target("2026-12", d);
    await target("2026-12", e, true);
    await visit(d, "2026-12-02", amb.id, rec.id);
    await visit(c, "2026-12-03", amb.id, rec.id); // متأخر من نوفمبر وانزار بديسمبر
    await visit(a, "2026-11-30", amb.id, rec.id); // زيارة نوفمبر ما بتنحسب لديسمبر

    const r = await monthFollowup("2026-12");
    expect(r.total).toBe(2);
    expect(r.excluded).toBe(1);
    expect(r.visited).toBe(1);
    expect(r.rate).toBe(50);
    expect(r.carried).toBe(1);
    expect(r.previousTotal).toBe(3);
    expect(r.previousRate).toBe(66.7);
    expect(r.overdue.map((o) => [o.code, o.resolvedThisMonth]).sort()).toEqual([
      ["G-1000-002", false],
      ["G-1000-003", true],
    ]);
    expect(r.byAmbassador).toEqual([{ key: "ali", visits: 1 }]);
    expect(await followupMonths()).toEqual(["2026-12", "2026-11"]);
  });
});
