import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // وقت بناء Docker ما في DATABASE_URL، وتوليد Prisma Client ما بيتصل بقاعدة البيانات أصلاً.
  // فبنحط قيمة مؤقتة بس للبناء. الاتصال الحقيقي بيصير من lib/db.ts وقت التشغيل.
  datasource: { url: process.env.DATABASE_URL ?? "postgresql://build:build@localhost:5432/build" },
});
