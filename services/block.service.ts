import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";

const blockSelect = {
  id: true,
  createdAt: true,
  blocked: {
    select: {
      id: true,
      username: true,
      status: true,
      profile: {
        select: {
          nickname: true,
          avatarUrl: true,
          region: true,
        },
      },
    },
  },
} satisfies Prisma.BlockSelect;

export type BlockListItem = Prisma.BlockGetPayload<{
  select: typeof blockSelect;
}>;

export async function listMyBlocks(userId: string) {
  return prisma.block.findMany({
    where: { blockerId: userId },
    orderBy: { createdAt: "desc" },
    select: blockSelect,
  });
}

export async function getBlockedRelationUserIds(userId: string) {
  const [blocksMade, blocksReceived] = await prisma.$transaction([
    prisma.block.findMany({
      where: { blockerId: userId },
      select: { blockedId: true },
    }),
    prisma.block.findMany({
      where: { blockedId: userId },
      select: { blockerId: true },
    }),
  ]);

  return [
    ...blocksMade.map((block) => block.blockedId),
    ...blocksReceived.map((block) => block.blockerId),
  ];
}

export async function hasBlockRelation(userId: string, targetUserId: string) {
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: userId, blockedId: targetUserId },
        { blockerId: targetUserId, blockedId: userId },
      ],
    },
    select: { id: true },
  });

  return Boolean(block);
}

export async function getBlockDirection(userId: string, targetUserId: string) {
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: userId, blockedId: targetUserId },
        { blockerId: targetUserId, blockedId: userId },
      ],
    },
    select: {
      blockerId: true,
      blockedId: true,
    },
  });

  if (!block) {
    return {
      hasRelation: false,
      blockedByMe: false,
      blockedMe: false,
    };
  }

  return {
    hasRelation: true,
    blockedByMe: block.blockerId === userId,
    blockedMe: block.blockedId === userId,
  };
}

export async function blockUser(blockerId: string, blockedId: string) {
  if (blockerId === blockedId) {
    throw new AppError("자기 자신은 차단할 수 없습니다.", 400);
  }

  const target = await prisma.user.findUnique({
    where: { id: blockedId },
    select: { id: true, status: true },
  });

  if (!target || target.status === "DELETED") {
    throw new AppError("차단할 사용자를 찾을 수 없습니다.", 404);
  }

  try {
    return await prisma.block.create({
      data: {
        blockerId,
        blockedId,
      },
      select: blockSelect,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError("이미 차단한 사용자입니다.", 409);
    }

    throw error;
  }
}

export async function unblockUser(blockerId: string, blockedId: string) {
  const result = await prisma.block.deleteMany({
    where: {
      blockerId,
      blockedId,
    },
  });

  if (result.count === 0) {
    throw new AppError("차단 내역을 찾을 수 없습니다.", 404);
  }
}
