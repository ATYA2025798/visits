import type { Metadata } from "next";
import { requirePermission } from "@/lib/session";
import { BulkSearch } from "@/components/BulkSearch";

export const metadata: Metadata = { title: "بحث جماعي" };

export default async function BulkPage() {
  await requirePermission("visits:view");
  return (
    <>
      <div className="page-head">
        <div>
          <h1>بحث جماعي</h1>
          <p className="muted">على غرار ورقة All Visits: يُبيَّن لكل كود ما إذا كان موجوداً، وعدد زياراته، وتاريخ آخر زيارة.</p>
        </div>
      </div>
      <BulkSearch />
    </>
  );
}
