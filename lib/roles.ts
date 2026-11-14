import type { Role } from "./authz";

export const ROLE_LABEL: Record<Role, string> = {
  AMBASSADOR: "سفير",
  MANAGER: "مسؤول",
  SUPPORT: "دعم النظام",
};

export const ROLE_HINT: Record<Role, string> = {
  AMBASSADOR: "صلاحيات كاملة على النظام",
  MANAGER: "اطلاع على لوحة المتابعة والإحصائيات دون صلاحية التعديل",
  SUPPORT: "صلاحيات كاملة مع الرقابة على سجل العمليات",
};
