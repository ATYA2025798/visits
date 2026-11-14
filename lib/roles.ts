import type { Role } from "./authz";

export const ROLE_LABEL: Record<Role, string> = {
  AMBASSADOR: "سفير",
  MANAGER: "مسؤول",
};

export const ROLE_HINT: Record<Role, string> = {
  AMBASSADOR: "صلاحيات كاملة على النظام",
  MANAGER: "اطلاع على جميع البيانات دون صلاحية التعديل",
};
