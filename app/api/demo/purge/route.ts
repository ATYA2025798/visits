import { NextResponse } from "next/server";
import { handler, apiRequire } from "@/lib/api";
import { purgeDemoData } from "@/lib/demo-purge";

/** حذف البيانات الوهمية من النسخة التجريبية (دعم النظام بس) */
export const POST = handler(async (req) => {
  const actor = await apiRequire(req, "legacy:import");
  return NextResponse.json(await purgeDemoData(actor.id));
});
