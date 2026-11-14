/**
 * حسابات الفريق (طلب علي 2026-11-14): 3 سفراء، 3 مسؤولين، وحساب دعم النظام المخفي.
 * كل حساب بيبدأ بكلمة سر افتراضية، وأول ما يدخل صاحبه لازم يختار كلمة سر جديدة.
 * التشغيل آمن يتكرر: الحساب الموجود ما بيتغيّر.
 */
import type { Db } from "./db";
import { withAudit } from "./audit";
import { hashPassword, MIN_PASSWORD_LENGTH } from "./password";
import type { Role } from "./authz";

export interface TeamMember {
  username: string;
  displayName: string;
  role: Role;
  /** حسابات نسخة العرض القديمة اللي بتتحوّل لهالحساب (بزياراتها) */
  demoUsername?: string;
}

export const TEAM: TeamMember[] = [
  { username: "ali.abusubha", displayName: "علي أبو صبحة", role: "AMBASSADOR", demoUsername: "ali" },
  { username: "omar.alaydi", displayName: "عمر العايدي", role: "AMBASSADOR", demoUsername: "sami" },
  { username: "mahmoud.ayesh", displayName: "محمود عايش", role: "AMBASSADOR", demoUsername: "yousef" },
  { username: "ramzi.abuanza", displayName: "رمزي أبو عنزة", role: "MANAGER", demoUsername: "boss" },
  { username: "adnan.abujumaiza", displayName: "عدنان أبو جميزة", role: "MANAGER" },
  { username: "mazen.almasri", displayName: "مازن المصري", role: "MANAGER" },
  { username: "sys.support", displayName: "دعم النظام", role: "SUPPORT" },
];

export interface EnsureTeamOptions {
  initialPassword: string;
  /** كلمة سر منفصلة لحساب دعم النظام (اختياري) */
  supportPassword?: string;
  /** نسخة العرض: تحويل حسابات التجربة القديمة لحسابات الفريق بدل إنشاء حسابات فاضية */
  adoptDemoAccounts?: boolean;
}

export async function ensureTeam(db: Db, opts: EnsureTeamOptions) {
  for (const p of [opts.initialPassword, opts.supportPassword]) {
    if (p !== undefined && p.length < MIN_PASSWORD_LENGTH) {
      throw new Error(`كلمة السر الافتراضية يجب ألا تقل عن ${MIN_PASSWORD_LENGTH} أحرف`);
    }
  }
  const created: string[] = [];
  const adopted: string[] = [];
  for (const m of TEAM) {
    const exists = await db.user.findUnique({ where: { username: m.username } });
    if (exists) continue;
    const password = m.role === "SUPPORT" && opts.supportPassword ? opts.supportPassword : opts.initialPassword;
    const passwordHash = await hashPassword(password);
    await withAudit(
      null,
      async (tx, audit) => {
        const old =
          opts.adoptDemoAccounts && m.demoUsername
            ? await tx.user.findUnique({ where: { username: m.demoUsername } })
            : null;
        if (old) {
          await tx.user.update({
            where: { id: old.id },
            data: {
              username: m.username,
              displayName: m.displayName,
              role: m.role,
              passwordHash,
              mustChangePassword: true,
              active: true,
              failedLoginCount: 0,
              lockedUntil: null,
            },
          });
          await tx.session.deleteMany({ where: { userId: old.id } });
          audit.event("UPDATE", "User", old.id, `تحويل حساب التجربة ${old.username} إلى ${m.username}`);
          adopted.push(m.username);
        } else {
          const u = await tx.user.create({
            data: {
              username: m.username,
              displayName: m.displayName,
              role: m.role,
              passwordHash,
              mustChangePassword: true,
            },
          });
          audit.created("User", u.id, {
            username: u.username,
            displayName: u.displayName,
            role: u.role,
            active: u.active,
          });
          created.push(m.username);
        }
      },
      db,
    );
  }
  return { created, adopted };
}
