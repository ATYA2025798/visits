"use client";

import Link from "next/link";
import { useMobile } from "@/components/m/MobileShell";

export default function MobileHome() {
  const { boot, online } = useMobile();
  return (
    <div className="grid">
      <h1 style={{ fontSize: 20 }}>أهلاً {boot?.me.displayName ?? ""}</h1>
      <div className="m-tiles">
        <Link className="m-tile" href="/m/visit">
          <b>زيارة جديدة</b>
          <span>تقرير، موقع، صور، مايكروتيك</span>
        </Link>
        <Link className="m-tile" href="/m/vpn">
          <b>حالة VPN</b>
          <span>اسم الشبكة وعنوان IP والمكان</span>
        </Link>
        <Link className="m-tile" href="/m/card">
          <b>شراء بطاقة</b>
          <span>السعر والشبكة</span>
        </Link>
        {online && (
          <>
            <Link className="m-tile m-tile-soft" href="/search">
              <b>البحث باستخدام Line Code</b>
              <span>يتطلب اتصالاً بالإنترنت</span>
            </Link>
            <Link className="m-tile m-tile-soft" href="/revisits">
              <b>إعادة الزيارة</b>
              <span>يتطلب اتصالاً بالإنترنت</span>
            </Link>
            <Link className="m-tile m-tile-soft" href="/">
              <b>الموقع الكامل</b>
              <span>يتطلب اتصالاً بالإنترنت</span>
            </Link>
          </>
        )}
      </div>
      <p className="small muted">
        تُحفَظ جميع البيانات المُدخلة هنا على الجهاز أولاً، وتُرسَل تلقائياً عند توفر الاتصال بالإنترنت. ويُسجَّل وقت التعبئة والموقع لحظة الحفظ.
      </p>
    </div>
  );
}
