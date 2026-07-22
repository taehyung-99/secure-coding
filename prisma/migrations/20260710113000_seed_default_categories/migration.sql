-- Seed default categories as migration data so fresh deployments get them
-- when `prisma migrate deploy` is executed, without requiring `prisma db seed`.
INSERT INTO "Category" ("id", "name", "slug", "createdAt")
VALUES
  ('cat_digital', '디지털기기', 'digital', CURRENT_TIMESTAMP),
  ('cat_appliance', '생활가전', 'appliance', CURRENT_TIMESTAMP),
  ('cat_furniture', '가구/인테리어', 'furniture', CURRENT_TIMESTAMP),
  ('cat_clothes', '의류', 'clothes', CURRENT_TIMESTAMP),
  ('cat_books', '도서', 'books', CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO UPDATE
SET "name" = EXCLUDED."name";
