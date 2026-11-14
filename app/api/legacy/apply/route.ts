import { NextResponse } from "next/server";
import { handler, apiRequire } from "@/lib/api";
import { applyLegacyImport } from "@/lib/import/legacy";
import { readLegacyUpload } from "@/lib/import/legacy-upload";

export const maxDuration = 300;

/** نقل الزيارات القديمة فعلياً (دعم النظام بس) */
export const POST = handler(async (req) => {
  const actor = await apiRequire(req, "legacy:import");
  const up = await readLegacyUpload(req);
  const r = await applyLegacyImport(up.buffer, { today: new Date(), fileName: up.fileName, actorId: actor.id });
  return NextResponse.json({ created: r.created, updated: r.updated, unchanged: r.unchanged });
});
