/**
 * كل قواعد الصلاحيات بمكان واحد. السيرفر بيسأل هون قبل أي عملية،
 * والواجهة بتسأل نفس الدوال بس عشان تخفي الأزرار — مش عشان الحماية.
 *
 * المرجع: جدول «المستخدمون والصلاحيات» بالمواصفات.
 * السفير بيعمل كل شي، والمسؤول بيشوف كل شي للقراءة بس (تصحيح علي 2026-11-13).
 * دعم النظام (2026-11-14): حساب مخفي عن الكل، إله كل الصلاحيات، وهو بس بيشوف
 * سجل التعديلات وسجل عرض كلمات السر وسلة المحذوفات.
 */

export type Role = "AMBASSADOR" | "MANAGER" | "SUPPORT";

export interface Actor {
  id: string;
  role: Role;
  active: boolean;
}

/** صلاحيات القراءة: للسفير والمسؤول */
export const READ_PERMISSIONS = [
  "visits:view", // يشوف كل الزيارات ويبحث بالـ Line Code
  "stats:view", // الخريطة والرئيسية والإحصائيات
  "export", // تصدير PDF وExcel
  "users:view", // قائمة الحسابات
] as const;

/** صلاحيات التغيير: للسفير بس */
export const WRITE_PERMISSIONS = [
  "visits:mine", // صفحة «زياراتي»
  "visits:create", // زيارة جديدة، VPN، بطاقة
  "visits:editStatus", // التوصية والإجراء وإعادة الزيارة لأي زيارة
  "visits:delete", // حذف ناعم لسلة المحذوفات
  "users:manage", // يضيف حسابات ويوقفها
  "lists:manage", // القوائم وأسئلة المايكروتيك
  "subscribers:import", // الملف الشهري والحساب الطارئ
  "mikrotik:reveal", // يشوف كلمة سر مايكروتيك
] as const;

/** صلاحيات دعم النظام بس: الرقابة على كل الحسابات */
export const SUPPORT_PERMISSIONS = [
  "audit:view", // سجل التعديلات الكامل
  "mikrotik:revealLog", // سجل عرض كلمات سر المايكروتيك
  "trash:view", // سلة المحذوفات والاسترجاع
  "support:see", // يشوف حساب دعم النظام بقائمة الحسابات
] as const;

export type Permission =
  | (typeof READ_PERMISSIONS)[number]
  | (typeof WRITE_PERMISSIONS)[number]
  | (typeof SUPPORT_PERMISSIONS)[number];

const READ_SET: ReadonlySet<Permission> = new Set(READ_PERMISSIONS);
const WRITE_SET: ReadonlySet<Permission> = new Set(WRITE_PERMISSIONS);

export function can(actor: Actor | null | undefined, permission: Permission): boolean {
  if (!actor || !actor.active) return false;
  if (actor.role === "SUPPORT") return true;
  if (actor.role === "AMBASSADOR") return READ_SET.has(permission) || WRITE_SET.has(permission);
  return READ_SET.has(permission);
}

export const isSupport = (actor: { role: Role } | null | undefined) => actor?.role === "SUPPORT";

/** تقرير الزيارة: ملك السفير اللي كتبه */
export interface VisitReportOwner {
  ownerId: string | null; // null = زيارة قديمة منقولة بدون صاحب
}

export type ReportEditDecision = "allowed" | "request" | "denied";

/**
 * مين بيعدّل تقرير زيارة؟
 * - المسؤول: ولا مرة
 * - صاحبها، أو أي سفير إذا كانت زيارة قديمة بدون صاحب: مباشرة
 * - تقرير سفير تاني: بطلب تعديل يوافق عليه صاحبها
 */
export function reportEditDecision(actor: Actor | null | undefined, visit: VisitReportOwner): ReportEditDecision {
  if (!actor || !actor.active) return "denied";
  if (actor.role === "SUPPORT") return "allowed";
  if (actor.role !== "AMBASSADOR") return "denied";
  if (visit.ownerId === null || visit.ownerId === actor.id) return "allowed";
  return "request";
}

export function canEditReport(actor: Actor | null | undefined, visit: VisitReportOwner): boolean {
  return reportEditDecision(actor, visit) === "allowed";
}

/** صاحب الزيارة بس بيوافق أو يرفض طلب تعديل على تقريره */
export function canDecideEditRequest(actor: Actor | null | undefined, visit: VisitReportOwner): boolean {
  if (!actor || !actor.active) return false;
  if (actor.role === "SUPPORT") return true;
  if (visit.ownerId === null) return false;
  return visit.ownerId === actor.id;
}
