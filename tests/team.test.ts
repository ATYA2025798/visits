import { beforeEach, describe, expect, it } from "vitest";
import { ensureTeam, TEAM } from "@/lib/team";
import { updateUser, resetPassword } from "@/lib/users";
import { login } from "@/lib/auth";
import { prisma, resetDb, makeUser } from "./helpers";

describe("حسابات الفريق ودعم النظام", () => {
  beforeEach(resetDb);

  it("تُنشأ الحسابات السبعة بكلمة سر افتراضية مع إلزام بتغييرها، والتكرار لا يغيّر شيئاً", async () => {
    const r = await ensureTeam(prisma, { initialPassword: "Jawwal-2026", supportPassword: "support-secret-1" });
    expect(r.created).toHaveLength(7);
    const users = await prisma.user.findMany();
    expect(users.filter((u) => u.role === "AMBASSADOR")).toHaveLength(3);
    expect(users.filter((u) => u.role === "MANAGER")).toHaveLength(3);
    expect(users.filter((u) => u.role === "SUPPORT")).toHaveLength(1);
    expect(users.every((u) => u.mustChangePassword)).toBe(true);
    const amb = await login("ali.abusubha", "Jawwal-2026");
    expect(amb.ok).toBe(true);
    expect((await login("sys.support", "Jawwal-2026")).ok).toBe(false);
    expect((await login("sys.support", "support-secret-1")).ok).toBe(true);

    const again = await ensureTeam(prisma, { initialPassword: "Other-pass-99" });
    expect(again.created).toHaveLength(0);
    expect((await login("ali.abusubha", "Jawwal-2026")).ok).toBe(true);
  });

  it("نسخة العرض: حسابات التجربة تتحوّل لحسابات الفريق مع زياراتها", async () => {
    const old = await makeUser("ali");
    const r = await ensureTeam(prisma, { initialPassword: "Jawwal-2026", adoptDemoAccounts: true });
    expect(r.adopted).toEqual(["ali.abusubha"]);
    const u = await prisma.user.findUniqueOrThrow({ where: { id: old.id } });
    expect(u.username).toBe("ali.abusubha");
    expect(u.displayName).toBe("علي أبو صبحة");
    expect(u.mustChangePassword).toBe(true);
    expect(await prisma.user.count()).toBe(TEAM.length);
  });

  it("السفير لا يستطيع تعديل حساب دعم النظام أو إصدار كلمة سر له", async () => {
    await ensureTeam(prisma, { initialPassword: "Jawwal-2026" });
    const amb = await prisma.user.findUniqueOrThrow({ where: { username: "ali.abusubha" } });
    const sup = await prisma.user.findUniqueOrThrow({ where: { username: "sys.support" } });
    await expect(updateUser(amb.id, sup.id, { active: false })).rejects.toMatchObject({ status: 404 });
    await expect(resetPassword(amb.id, sup.id)).rejects.toMatchObject({ status: 404 });
    // ودعم النظام يقدر يدير أي حساب
    await expect(resetPassword(sup.id, amb.id)).resolves.toHaveProperty("tempPassword");
  });
});
