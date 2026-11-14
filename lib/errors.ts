/** خطأ برسالة للمستخدم ورمز HTTP. ما بيعتمد على Next، فبيشتغل بالسكربتات كمان. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const unauthorized = () => new ApiError(401, "يجب تسجيل الدخول");
export const forbidden = () => new ApiError(403, "ليست لديك صلاحية لتنفيذ هذه العملية");
export const notFound = () => new ApiError(404, "غير موجود");

/** كتير طلبات: 429 مع Retry-After */
export class RateLimitError extends ApiError {
  constructor(public retryAfterSec: number, message = "عدد كبير من الطلبات المتتالية. يُرجى الانتظار قليلاً ثم المحاولة مرة أخرى.") {
    super(429, message);
  }
}
