"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";

type Item = { href: string; label: string; icon?: string; soon?: boolean; count?: number; exact?: boolean };

// الصفحات اللي جاية بالمراحل الجاية بتظهر «قريباً» عشان الشكل العام يبيّن من هلأ
const MAIN: Item[] = [
  { href: "/", label: "الرئيسية", icon: "home" },
  { href: "/search", label: "البحث باستخدام Line Code", icon: "search" },
  { href: "/visits", label: "الزيارات", exact: true, icon: "list" },
  { href: "/visits/mine", label: "زياراتي", icon: "user" },
  { href: "/revisits", label: "إعادة الزيارة", icon: "refresh" },
  { href: "/map", label: "الخريطة", icon: "map" },
  { href: "/followup", label: "متابعة ملف الشهر", icon: "target" },
  { href: "/vpn", label: "حالات VPN", icon: "shield" },
  { href: "/cards", label: "البطاقات", icon: "card" },
  { href: "/mikrotik/access", label: "بحاجة إلى صلاحية access", icon: "key" },
];

// للسفراء بس
const FIELD: Item[] = [{ href: "/m", label: "تطبيق الميدان", icon: "phone" }];

const MANAGE: Item[] = [
  { href: "/admin/lines", label: "خطوط المشتركين", icon: "database" },
  { href: "/admin/import", label: "ملف الشهر", icon: "upload" },
  { href: "/admin/lists", label: "القوائم", icon: "sliders" },
  { href: "/admin/users", label: "المستخدمون", icon: "users" },
];

// دعم النظام بس
const OVERSIGHT: Item[] = [
  { href: "/admin/audit", label: "سجل العمليات", icon: "history" },
  { href: "/mikrotik/reveals", label: "سجل عرض كلمات السر", icon: "eye" },
  { href: "/admin/trash", label: "سلة المحذوفات", icon: "trash" },
  { href: "/admin/legacy", label: "نقل الزيارات القديمة", icon: "upload" },
];

const ACCOUNT: Item[] = [{ href: "/account/password", label: "تغيير كلمة السر", icon: "lock" }];

function NavItem({ item, path }: { item: Item; path: string }) {
  if (item.soon) {
    return (
      <span className="nav-soon" aria-disabled="true">
        {item.label}
        <span className="soon-tag">قريباً</span>
      </span>
    );
  }
  const active =
    item.href === "/"
      ? path === "/"
      : item.exact
        ? path === item.href || (path.startsWith(`${item.href}/`) && !path.startsWith(`${item.href}/mine`))
        : path.startsWith(item.href);
  return (
    <Link href={item.href} aria-current={active ? "page" : undefined}>
      <span className="nav-label">
        {item.icon && <Icon name={item.icon} />}
        {item.label}
      </span>
      {!!item.count && (
        <span className="badge badge-red" aria-label={`${item.count} بانتظارك`}>
          {item.count}
        </span>
      )}
    </Link>
  );
}

export function Nav({
  showAdmin,
  isAmbassador,
  isSupport,
  inbox,
}: {
  showAdmin: boolean;
  isAmbassador: boolean;
  isSupport: boolean;
  inbox: number;
}) {
  const path = usePathname();
  // زياراتي وطلبات التعديل للسفير بس
  const main = MAIN.filter((i) => isAmbassador || i.href !== "/visits/mine");
  const account = isAmbassador
    ? [{ href: "/inbox", label: "طلبات التعديل", count: inbox, icon: "inbox" }, ...ACCOUNT]
    : ACCOUNT;
  return (
    <nav className="nav">
      {main.map((i) => (
        <NavItem key={i.href} item={i} path={path} />
      ))}
      {isAmbassador && (
        <>
          <div className="nav-group">الميدان</div>
          {FIELD.map((i) => (
            <NavItem key={i.href} item={i} path={path} />
          ))}
        </>
      )}
      {showAdmin && (
        <>
          <div className="nav-group">الإدارة</div>
          {MANAGE.map((i) => (
            <NavItem key={i.href} item={i} path={path} />
          ))}
        </>
      )}
      {isSupport && (
        <>
          <div className="nav-group">الرقابة</div>
          {OVERSIGHT.map((i) => (
            <NavItem key={i.href} item={i} path={path} />
          ))}
        </>
      )}
      <div className="nav-group">حسابي</div>
      {account.map((i) => (
        <NavItem key={i.href} item={i} path={path} />
      ))}
    </nav>
  );
}
