import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { hasBlockRelation } from "@/services/block.service";

type CreateChatRoomInput = {
  productId?: string;
  targetUserId?: string;
};

const GLOBAL_CHAT_NAME = "global";

const chatRoomSelect = {
  id: true,
  type: true,
  name: true,
  productId: true,
  userOneId: true,
  userTwoId: true,
  createdAt: true,
  updatedAt: true,
  product: {
    select: {
      id: true,
      title: true,
      price: true,
      status: true,
      visibility: true,
    },
  },
  userOne: {
    select: {
      id: true,
      username: true,
      profile: {
        select: {
          nickname: true,
          avatarUrl: true,
        },
      },
    },
  },
  userTwo: {
    select: {
      id: true,
      username: true,
      profile: {
        select: {
          nickname: true,
          avatarUrl: true,
        },
      },
    },
  },
  messages: {
    orderBy: { createdAt: "desc" },
    take: 1,
    select: {
      id: true,
      content: true,
      createdAt: true,
      senderId: true,
    },
  },
} satisfies Prisma.ChatRoomSelect;

const messageSelect = {
  id: true,
  chatRoomId: true,
  content: true,
  readAt: true,
  createdAt: true,
  senderId: true,
  sender: {
    select: {
      id: true,
      username: true,
      profile: {
        select: {
          nickname: true,
          avatarUrl: true,
        },
      },
    },
  },
} satisfies Prisma.MessageSelect;

export type ChatRoomSummary = Prisma.ChatRoomGetPayload<{
  select: typeof chatRoomSelect;
}> & {
  unreadCount: number;
};

export type ChatMessage = Prisma.MessageGetPayload<{
  select: typeof messageSelect;
}>;

function orderedUserIds(userA: string, userB: string) {
  return [userA, userB].sort() as [string, string];
}

function isParticipant(
  room: { type: string; userOneId: string | null; userTwoId: string | null },
  userId: string,
) {
  if (room.type === "GLOBAL") {
    return true;
  }

  return room.userOneId === userId || room.userTwoId === userId;
}

async function assertCanCommunicate(userId: string, targetUserId: string) {
  if (userId === targetUserId) {
    throw new AppError("자기 자신과는 채팅방을 만들 수 없습니다.", 400);
  }

  const blocked = await hasBlockRelation(userId, targetUserId);

  if (blocked) {
    throw new AppError("차단 관계가 있는 사용자와는 메시지를 보낼 수 없습니다.", 403);
  }
}

export async function listChatRooms(user: SessionUser) {
  const rooms = await prisma.chatRoom.findMany({
    where: {
      OR: [{ type: "GLOBAL" }, { userOneId: user.id }, { userTwoId: user.id }],
    },
    orderBy: { updatedAt: "desc" },
    select: chatRoomSelect,
  });
  const roomIds = rooms
    .filter((room) => room.type !== "GLOBAL")
    .map((room) => room.id);

  if (roomIds.length === 0) {
    return rooms.map((room) => ({
      ...room,
      unreadCount: 0,
    }));
  }

  const unreadCounts = await prisma.message.groupBy({
    by: ["chatRoomId"],
    where: {
      chatRoomId: {
        in: roomIds,
      },
      senderId: {
        not: user.id,
      },
      readAt: null,
    },
    _count: {
      _all: true,
    },
  });
  const unreadCountByRoomId = new Map(
    unreadCounts.map((item) => [item.chatRoomId, item._count._all]),
  );

  return rooms.map((room) => ({
    ...room,
    unreadCount: unreadCountByRoomId.get(room.id) ?? 0,
  }));
}

export async function countChatNotifications(user: SessionUser) {
  return prisma.message.count({
    where: {
      senderId: {
        not: user.id,
      },
      readAt: null,
      chatRoom: {
        type: {
          in: ["PRODUCT", "DIRECT"],
        },
        OR: [{ userOneId: user.id }, { userTwoId: user.id }],
      },
    },
  });
}

export async function createChatRoom(user: SessionUser, input: CreateChatRoomInput) {
  if (input.productId) {
    return createProductChatRoom(user, input.productId);
  }

  if (!input.targetUserId) {
    throw new AppError("대화할 사용자를 선택해 주세요.", 400);
  }

  return createDirectChatRoom(user, input.targetUserId);
}

export async function getOrCreateGlobalChatRoom() {
  const existingRoom = await prisma.chatRoom.findUnique({
    where: {
      type_name: {
        type: "GLOBAL",
        name: GLOBAL_CHAT_NAME,
      },
    },
    select: chatRoomSelect,
  });

  if (existingRoom) {
    return existingRoom;
  }

  return prisma.chatRoom.create({
    data: {
      type: "GLOBAL",
      name: GLOBAL_CHAT_NAME,
    },
    select: chatRoomSelect,
  });
}

async function createProductChatRoom(user: SessionUser, productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      sellerId: true,
      visibility: true,
    },
  });

  if (!product || product.visibility !== "VISIBLE") {
    throw new AppError("채팅할 상품을 찾을 수 없습니다.", 404);
  }

  await assertCanCommunicate(user.id, product.sellerId);

  const [userOneId, userTwoId] = orderedUserIds(user.id, product.sellerId);
  const existingRoom = await prisma.chatRoom.findFirst({
    where: {
      type: "PRODUCT",
      productId,
      userOneId,
      userTwoId,
    },
    select: chatRoomSelect,
  });

  if (existingRoom) {
    return existingRoom;
  }

  return prisma.chatRoom.create({
    data: {
      type: "PRODUCT",
      productId,
      userOneId,
      userTwoId,
    },
    select: chatRoomSelect,
  });
}

async function createDirectChatRoom(user: SessionUser, targetUserId: string) {
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      status: true,
    },
  });

  if (!targetUser || targetUser.status !== "ACTIVE") {
    throw new AppError("대화할 사용자를 찾을 수 없습니다.", 404);
  }

  await assertCanCommunicate(user.id, targetUserId);

  const [userOneId, userTwoId] = orderedUserIds(user.id, targetUserId);
  const existingRoom = await prisma.chatRoom.findFirst({
    where: {
      type: "DIRECT",
      productId: null,
      userOneId,
      userTwoId,
    },
    select: chatRoomSelect,
  });

  if (existingRoom) {
    return existingRoom;
  }

  return prisma.chatRoom.create({
    data: {
      type: "DIRECT",
      userOneId,
      userTwoId,
    },
    select: chatRoomSelect,
  });
}

export async function getChatRoom(user: SessionUser, chatRoomId: string) {
  const room = await prisma.chatRoom.findUnique({
    where: { id: chatRoomId },
    select: chatRoomSelect,
  });

  if (!room || !isParticipant(room, user.id)) {
    throw new AppError("채팅방을 찾을 수 없습니다.", 404);
  }

  if (room.type === "GLOBAL") {
    return room;
  }

  if (!room.userOneId || !room.userTwoId) {
    throw new AppError("채팅방 정보가 올바르지 않습니다.", 500);
  }

  const otherUserId = room.userOneId === user.id ? room.userTwoId : room.userOneId;

  if (await hasBlockRelation(user.id, otherUserId)) {
    throw new AppError("차단 관계가 있는 채팅방입니다.", 403);
  }

  return room;
}

export async function listMessages(user: SessionUser, chatRoomId: string) {
  const room = await getChatRoom(user, chatRoomId);

  if (room.type !== "GLOBAL") {
    await prisma.message.updateMany({
      where: {
        chatRoomId,
        senderId: {
          not: user.id,
        },
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });
  }

  return prisma.message.findMany({
    where: { chatRoomId },
    orderBy: { createdAt: "asc" },
    select: messageSelect,
  });
}

export async function listGlobalMessages(user: SessionUser) {
  const room = await getOrCreateGlobalChatRoom();

  return listMessages(user, room.id);
}

export async function createMessage(
  user: SessionUser,
  chatRoomId: string,
  content: string,
) {
  const room = await getChatRoom(user, chatRoomId);

  if (room.type === "GLOBAL") {
    return createMessageInRoom(user.id, chatRoomId, content);
  }

  if (!room.userOneId || !room.userTwoId) {
    throw new AppError("채팅방 정보가 올바르지 않습니다.", 500);
  }

  const otherUserId = room.userOneId === user.id ? room.userTwoId : room.userOneId;

  await assertCanCommunicate(user.id, otherUserId);

  return createMessageInRoom(user.id, chatRoomId, content);
}

export async function createGlobalMessage(user: SessionUser, content: string) {
  const room = await getOrCreateGlobalChatRoom();

  return createMessageInRoom(user.id, room.id, content);
}

async function createMessageInRoom(
  senderId: string,
  chatRoomId: string,
  content: string,
) {
  return prisma.$transaction(async (tx) => {
    const message = await tx.message.create({
      data: {
        chatRoomId,
        senderId,
        content: content.trim(),
      },
      select: messageSelect,
    });

    await tx.chatRoom.update({
      where: { id: chatRoomId },
      data: { updatedAt: new Date() },
    });

    return message;
  });
}
