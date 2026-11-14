import { NextResponse } from "next/server";
import { z } from "zod";
import { handler, parseBody, ApiError } from "@/lib/api";
import { login, normalizeUsername, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { clientKey, loginIpLimiter, loginLimiter } from "@/lib/rate-limit";
import { RateLimitError } from "@/lib/errors";

const schema = z.object({
  username: z.string().min(1, "أدخل اسم الدخول").max(64),
  password: z.string().min(1, "أدخل كلمة السر").max(200),
});

export const POST = handler(async (req) => {
  const { username, password } = await parseBody(req, schema);
  const ip = clientKey(req.headers);
  const userKey = `${ip}|${normalizeUsername(username)}`;
  for (const rl of [loginLimiter.check(userKey), ip === "direct" ? null : loginIpLimiter.check(ip)]) {
    if (rl && !rl.ok) throw new RateLimitError(rl.retryAfterSec, "تم تجاوز عدد محاولات الدخول المسموح بها. يُرجى الانتظار قليلاً ثم المحاولة مرة أخرى.");
  }
  const result = await login(username, password, { userAgent: req.headers.get("user-agent") });
  if (!result.ok) {
    loginLimiter.hit(userKey);
    if (ip !== "direct") loginIpLimiter.hit(ip);
    if (result.reason === "locked") {
      throw new ApiError(423, `الحساب مقفل مؤقتاً بسبب محاولات دخول خاطئة. يُرجى المحاولة بعد ${result.minutes} دقيقة.`);
    }
    throw new ApiError(401, "اسم الدخول أو كلمة السر غير صحيح");
  }
  const res = NextResponse.json({ ok: true, mustChangePassword: result.user.mustChangePassword });
  res.cookies.set(SESSION_COOKIE, result.token, sessionCookieOptions(result.expiresAt));
  return res;
});
