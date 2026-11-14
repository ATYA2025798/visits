-- الصور داخل قاعدة البيانات للاستضافات بدون قرص دائم (ATTACHMENTS_IN_DB=true)
ALTER TABLE "attachments" ADD COLUMN IF NOT EXISTS "data" BYTEA;
