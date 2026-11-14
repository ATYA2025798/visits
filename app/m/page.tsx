"use client";

import Link from "next/link";
import { useMobile } from "@/components/m/MobileShell";
import { Icon } from "@/components/Icon";
import { fmtLongDate } from "@/lib/format";

const ACTIONS = [
  { href: "/m/visit", icon: "plus", title: "تسجيل زيارة جديدة", hint: "التقرير والموقع والصور وإجابات المايكروتيك", primary: true },
  { href: "/m/vpn", icon: "shield", title: "حالة VPN", hint: "اسم الشبكة وعنوان IP والمكان" },
  { href: "/m/card", icon: "card", title: "شراء بطاقة", hint: "اسم البطاقة أو الشبكة والسعر" },
];

const LINKS = [
  { href: "/search", icon: "search", title: "بحث Line Code" },
  { href: "/revisits", icon: "refresh", title: "إعادة الزيارة" },
  { href: "/", icon: "chart", title: "لوحة المتابعة" },
];

export default function MobileHome() {
  const { boot, online } = useMobile();
  const st = boot?.stats;
  return (
    <div className="grid" style={{ gap: 14 }}>
      <section className="m-hero" aria-label="ملخص">
        <h1>مرحباً، {boot?.me.displayName ?? ""}</h1>
        <div className="m-date">{fmtLongDate(new Date())}</div>
        <div className="m-stats">
          <div className="m-stat">
            <b>{st?.today ?? "—"}</b>
            <span>زياراتي اليوم</span>
          </div>
          <div className="m-stat">
            <b>{st?.month ?? "—"}</b>
            <span>زياراتي هذا الشهر</span>
          </div>
          <div className="m-stat">
            <b>{st?.openRevisits ?? "—"}</b>
            <span>بانتظار إعادة زيارة</span>
          </div>
        </div>
      </section>

      {boot?.me.canCreate !== false && (
        <>
          <h2 className="m-section-title">إجراءات الميدان</h2>
          <div className="m-actions">
            {ACTIONS.map((a) => (
              <Link key={a.href} className={`m-action${a.primary ? " m-action-primary" : ""}`} href={a.href}>
                <span className={`kpi-icon ${a.primary ? "kpi-green" : "kpi-blue"}`}>
                  <Icon name={a.icon} size={22} />
                </span>
                <span>
                  <b>{a.title}</b>
                  <span>{a.hint}</span>
                </span>
                <Icon name="arrow" size={18} className="chev" />
              </Link>
            ))}
          </div>
        </>
      )}

      {online && (
        <>
          <h2 className="m-section-title">روابط سريعة</h2>
          <div className="m-links">
            {LINKS.map((l) => (
              <Link key={l.href} className="m-link" href={l.href}>
                <Icon name={l.icon} size={22} />
                {l.title}
              </Link>
            ))}
          </div>
        </>
      )}

      <p className="small muted" style={{ margin: 0 }}>
        تُحفَظ جميع البيانات المُدخلة هنا على الجهاز أولاً، وتُرسَل تلقائياً عند توفر الاتصال بالإنترنت. ويُسجَّل وقت
        التعبئة والموقع لحظة الحفظ.
      </p>
    </div>
  );
}
