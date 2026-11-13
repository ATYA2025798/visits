#!/bin/sh
# إقلاع نسخة العرض: الـ migrations، وبعدين بيانات وهمية إذا القاعدة فاضية، وبعدين الموقع
set -e
node scripts/migrate.mjs
npx tsx scripts/seed-demo.ts --if-empty
exec node scripts/start-standalone.mjs
