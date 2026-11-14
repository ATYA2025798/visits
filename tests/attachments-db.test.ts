import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { storeImages, readAttachment, type DecodedImage } from "@/lib/attachments";
import { prisma, resetDb, makeUser } from "./helpers";

describe("حفظ الصور داخل قاعدة البيانات", () => {
  beforeEach(resetDb);
  afterEach(() => {
    delete process.env.ATTACHMENTS_IN_DB;
  });

  it("مع ATTACHMENTS_IN_DB تُحفظ الصورة في القاعدة وتُقرأ منها", async () => {
    process.env.ATTACHMENTS_IN_DB = "true";
    const u = await makeUser("ali");
    const img: DecodedImage = { buffer: Buffer.from([0xff, 0xd8, 0xff, 1, 2, 3]), mime: "image/jpeg", ext: "jpg" };
    const entityId = randomUUID();
    await prisma.$transaction((tx) => storeImages(tx, "Visit", entityId, [img], u.id));
    const a = await prisma.attachment.findFirstOrThrow({ where: { entityId } });
    expect(a.path).toBe(`db:${a.id}`);
    const r = await readAttachment(a.id);
    expect(r?.buffer.equals(img.buffer)).toBe(true);
  });
});
