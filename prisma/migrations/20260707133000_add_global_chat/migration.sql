ALTER TYPE "ChatRoomType" ADD VALUE 'GLOBAL';

ALTER TABLE "ChatRoom" ADD COLUMN "name" TEXT;
ALTER TABLE "ChatRoom" ALTER COLUMN "userOneId" DROP NOT NULL;
ALTER TABLE "ChatRoom" ALTER COLUMN "userTwoId" DROP NOT NULL;

CREATE UNIQUE INDEX "ChatRoom_type_name_key" ON "ChatRoom"("type", "name");
