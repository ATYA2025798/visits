#!/bin/sh
# إقلاع النسخة الرسمية على Render: الـ migrations، تنظيف بيانات العرض القديمة (مرة وحدة)،
# حسابات الفريق إذا مش موجودة، وبعدين الموقع.
set -e
node scripts/migrate.mjs
npx tsx scripts/cleanup-demo.ts
npx tsx scripts/ensure-team.ts
exec node scripts/start-standalone.mjs
