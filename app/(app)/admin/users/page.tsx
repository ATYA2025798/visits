import type { Metadata } from "next";
import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { publicUserSelect, visibleUsersWhere } from "@/lib/users";
import { can } from "@/lib/authz";
import { UsersManager, type UserRow } from "./UsersManager";

function isLockedNow(lockedUntil: Date | null): boolean {
  return lockedUntil !== null && lockedUntil.getTime() > Date.now();
}

export const metadata: Metadata = { title: "المستخدمون" };

export default async function UsersPage() {
  const me = await requirePermission("users:view");
  const users = await prisma.user.findMany({
    where: visibleUsersWhere(me),
    select: { ...publicUserSelect, sessions: { select: { lastSeenAt: true }, orderBy: { lastSeenAt: "desc" } } },
    orderBy: [{ active: "desc" }, { role: "asc" }, { createdAt: "asc" }],
  });
  const rows: UserRow[] = users.map(({ sessions, ...u }) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
    locked: isLockedNow(u.lockedUntil),
    lockedUntil: u.lockedUntil?.toISOString() ?? null,
    sessionCount: sessions.length,
    lastSeenAt: sessions[0]?.lastSeenAt.toISOString() ?? null,
  }));

  return (
    <>
      <div className="page-head">
        <div>
          <h1>المستخدمون</h1>
          <p className="muted">
            لكل مستخدم حساب شخصي. يتولى السفراء إدارة الحسابات، ويطّلع عليها المسؤول دون صلاحية التعديل. ويؤدي الإيقاف أو «تسجيل الخروج من جميع الأجهزة» إلى إخراج المستخدم فوراً، وهو مفيد في حال فقدان الجهاز.
          </p>
        </div>
      </div>
      <UsersManager initialUsers={rows} meId={me.id} canManage={can(me, "users:manage")} />
    </>
  );
}
