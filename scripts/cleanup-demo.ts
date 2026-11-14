/** إقلاع النسخة الرسمية: حذف بيانات نسخة العرض القديمة مرة واحدة فقط (lib/demo-purge.ts) */
import { createPrisma } from "../lib/db";
import { removeSeededDemoData } from "../lib/demo-purge";

async function main() {
  const db = createPrisma();
  try {
    const r = await removeSeededDemoData(db);
    if (r) console.log(`حُذفت بيانات نسخة العرض: ${r.visits} زيارة، ${r.lines} خط، ${r.vpn} حالة VPN، ${r.cards} بطاقة`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
