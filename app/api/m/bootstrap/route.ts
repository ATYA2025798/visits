import { NextResponse } from "next/server";
import { handler, apiUser } from "@/lib/api";
import { can } from "@/lib/authz";
import { listItems } from "@/lib/lists";
import { mikrotikQuestions } from "@/lib/mikrotik";
import { prisma } from "@/lib/db";
import { todayLocal } from "@/lib/dates";
import { openRevisits } from "@/lib/revisits";

/** كل اللي بيحتاجه تطبيق الجوال ليعبّي بدون نت. بينحفظ بالجوال ويتحدّث كل ما يفتح التطبيق مع نت */
export const GET = handler(async (req) => {
  const me = await apiUser(req);
  const today = todayLocal();
  const day = new Date(`${today}T00:00:00Z`);
  const monthStart = new Date(`${today.slice(0, 7)}-01T00:00:00Z`);
  const mine = { ownerId: me.id, deletedAt: null };
  const [recommendations, actions, ambassadors, questions, todayCount, monthCount, revisits] = await Promise.all([
    listItems("RECOMMENDATION"),
    listItems("ACTION"),
    prisma.user.findMany({
      where: { role: "AMBASSADOR", active: true },
      select: { id: true, displayName: true },
      orderBy: { displayName: "asc" },
    }),
    mikrotikQuestions(),
    prisma.visit.count({ where: { ...mine, visitedOn: day } }),
    prisma.visit.count({ where: { ...mine, visitedOn: { gte: monthStart } } }),
    openRevisits({}),
  ]);
  return NextResponse.json(
    {
      me: { id: me.id, displayName: me.displayName, role: me.role, canCreate: can(me, "visits:create") },
      recommendations: recommendations.map(({ id, label }) => ({ id, label })),
      actions: actions.map(({ id, label }) => ({ id, label })),
      ambassadors,
      mikrotikQuestions: questions.map(({ id, text, options }) => ({ id, text, options })),
      stats: { today: todayCount, month: monthCount, openRevisits: revisits.length },
      savedAt: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
});
