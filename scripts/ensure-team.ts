/**
 * إنشاء حسابات الفريق إذا مش موجودة (lib/team.ts).
 *   TEAM_INITIAL_PASSWORD=... [SUPPORT_PASSWORD=...] npx tsx scripts/ensure-team.ts [--adopt-demo]
 * بدون TEAM_INITIAL_PASSWORD بنستعمل DEMO_PASSWORD (نسخة العرض).
 */
import { createPrisma } from "../lib/db";
import { ensureTeam } from "../lib/team";

async function main() {
  const initialPassword = process.env.TEAM_INITIAL_PASSWORD || process.env.DEMO_PASSWORD;
  if (!initialPassword) {
    console.error("حدد TEAM_INITIAL_PASSWORD (كلمة السر الافتراضية لأول دخول)");
    process.exit(1);
  }
  const db = createPrisma();
  try {
    const r = await ensureTeam(db, {
      initialPassword,
      supportPassword: process.env.SUPPORT_PASSWORD || undefined,
      adoptDemoAccounts: process.argv.includes("--adopt-demo"),
    });
    console.log(`حسابات الفريق: ${r.created.length} جديد، ${r.adopted.length} محوّل من حسابات التجربة`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
