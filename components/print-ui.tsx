import { fmtDateTime } from "@/lib/format";
import { PrintButton } from "./PrintButton";


/** رأس صفحة الطباعة: العنوان، وصف قصير، مين طلع التقرير ومتى، ولوجو جوال */
export function PrintHeader({ title, subtitle, by }: { title: string; subtitle?: string; by: string }) {
  return (
    <>
      <div className="print-toolbar">
        <PrintButton />
      </div>
      <header className="print-head">
        <div>
          <h1>{title}</h1>
          {subtitle && <div className="meta">{subtitle}</div>}
          <div className="meta">
            طلعه {by} · {fmtDateTime(new Date())}
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- صورة ثابتة بصفحة طباعة */}
        <img src="/brand/jawwal-logo.png" alt="جوال" />
      </header>
    </>
  );
}

export function Dot({ color }: { color?: string | null }) {
  return <span className="dot" style={{ background: color ?? "#7a8693" }} aria-hidden="true" />;
}
