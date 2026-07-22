import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { hashPassword, verifyPassword } from "@/lib/password";
import { deleteLocalProfileImage } from "@/lib/upload";
import { getUserById } from "@/services/auth.service";
import {
  getBlockedRelationUserIds,
  getBlockDirection,
} from "@/services/block.service";

type UpdateProfileInput = {
  nickname?: string;
  region?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
};

type UpdatePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

export async function getMyProfile(userId: string) {
  return getUserById(userId);
}

export async function getPublicUserProfile(
  targetUserId: string,
  viewer?: SessionUser | null,
) {
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      username: true,
      role: true,
      status: true,
      createdAt: true,
      profile: {
        select: {
          nickname: true,
          region: true,
          bio: true,
          avatarUrl: true,
        },
      },
      products: {
        where: {
          visibility: "VISIBLE",
        },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          title: true,
          price: true,
          status: true,
          viewCount: true,
          createdAt: true,
          images: {
            orderBy: { sortOrder: "asc" },
            take: 1,
            select: {
              url: true,
              altText: true,
            },
          },
        },
      },
      _count: {
        select: {
          products: {
            where: {
              visibility: "VISIBLE",
            },
          },
          buyerTransactions: true,
          sellerTransactions: true,
        },
      },
    },
  });

  if (!targetUser) {
    throw new AppError("사용자를 찾을 수 없습니다.", 404);
  }

  const canViewInactive = Boolean(
    viewer && (viewer.role === "ADMIN" || viewer.id === targetUser.id),
  );

  if (targetUser.status !== "ACTIVE" && !canViewInactive) {
    throw new AppError("사용자를 찾을 수 없습니다.", 404);
  }

  let blockedByMe = false;

  if (viewer && viewer.id !== targetUser.id && viewer.role !== "ADMIN") {
    const blockDirection = await getBlockDirection(viewer.id, targetUser.id);
    blockedByMe = blockDirection.blockedByMe;

    if (blockDirection.blockedMe) {
      throw new AppError("사용자를 찾을 수 없습니다.", 404);
    }
  }

  return {
    ...targetUser,
    blockedByMe,
    products: targetUser.products.map((product) => ({
      ...product,
      thumbnailUrl: product.images[0]?.url ?? null,
    })),
  };
}

export async function updateMyProfile(
  userId: string,
  input: UpdateProfileInput,
) {
  const hasProfileChanges = Object.values(input).some(
    (value) => value !== undefined,
  );

  if (!hasProfileChanges) {
    return getUserById(userId);
  }

  if (input.nickname !== undefined) {
    const nickname = input.nickname.trim();
    const existingProfile = await prisma.profile.findFirst({
      where: {
        nickname,
        userId: {
          not: userId,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingProfile) {
      throw new AppError("이미 사용 중인 닉네임입니다.", 409);
    }
  }

  const currentProfile =
    input.avatarUrl !== undefined
      ? await prisma.profile.findUnique({
          where: { userId },
          select: { avatarUrl: true },
        })
      : null;

  await prisma.profile.upsert({
    where: { userId },
    update: {
      ...(input.nickname !== undefined ? { nickname: input.nickname.trim() } : {}),
      ...(input.region !== undefined ? { region: input.region?.trim() ?? null } : {}),
      ...(input.bio !== undefined ? { bio: input.bio?.trim() ?? null } : {}),
      ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
    },
    create: {
      userId,
      nickname: input.nickname?.trim() ?? "사용자",
      region: input.region?.trim() ?? null,
      bio: input.bio?.trim() ?? null,
      avatarUrl: input.avatarUrl ?? null,
    },
  });

  if (
    input.avatarUrl !== undefined &&
    currentProfile?.avatarUrl &&
    currentProfile.avatarUrl !== input.avatarUrl
  ) {
    await deleteLocalProfileImage(currentProfile.avatarUrl);
  }

  return getUserById(userId);
}

export async function verifyMyPassword(userId: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      passwordHash: true,
    },
  });

  if (!user) {
    throw new AppError("사용자를 찾을 수 없습니다.", 404);
  }

  const isValidPassword = await verifyPassword(password, user.passwordHash);

  if (!isValidPassword) {
    throw new AppError("현재 비밀번호가 올바르지 않습니다.", 401);
  }
}

export async function updateMyPassword(
  userId: string,
  input: UpdatePasswordInput,
) {
  if (input.currentPassword === input.newPassword) {
    throw new AppError("새 비밀번호는 현재 비밀번호와 달라야 합니다.", 400);
  }

  await verifyMyPassword(userId, input.currentPassword);

  const passwordHash = await hashPassword(input.newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}

export async function searchUsers(currentUserId: string, query: string) {
  const blockedUserIds = await getBlockedRelationUserIds(currentUserId);

  return prisma.user.findMany({
    where: {
      id: {
        not: currentUserId,
        notIn: blockedUserIds,
      },
      status: "ACTIVE",
      OR: [
        {
          username: {
            contains: query.trim().toLowerCase(),
            mode: "insensitive",
          },
        },
        {
          profile: {
            nickname: {
              contains: query.trim(),
              mode: "insensitive",
            },
          },
        },
      ],
    },
    take: 10,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      profile: {
        select: {
          nickname: true,
          avatarUrl: true,
          region: true,
        },
      },
    },
  });
}
