import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { hashPassword, verifyPassword } from "@/lib/password";

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCK_MINUTES = 15;

type SignupInput = {
  username: string;
  email: string;
  password: string;
  confirmPassword?: string;
  nickname: string;
};

type LoginInput = {
  identifier: string;
  password: string;
};

const userSelect = {
  id: true,
  username: true,
  email: true,
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
} satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{
  select: typeof userSelect;
}>;

export async function signup(input: SignupInput) {
  const username = input.username.trim().toLowerCase();
  const email = input.email.trim().toLowerCase();
  const nickname = input.nickname.trim();

  if (input.confirmPassword && input.password !== input.confirmPassword) {
    throw new AppError("비밀번호 확인이 일치하지 않습니다.", 400);
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { email }],
    },
    select: {
      username: true,
      email: true,
    },
  });

  if (existingUser?.username === username) {
    throw new AppError("이미 사용 중인 아이디입니다.", 409);
  }

  if (existingUser?.email === email) {
    throw new AppError("이미 가입된 이메일입니다.", 409);
  }

  const existingNickname = await prisma.profile.findFirst({
    where: {
      nickname,
    },
    select: {
      id: true,
    },
  });

  if (existingNickname) {
    throw new AppError("이미 사용 중인 닉네임입니다.", 409);
  }

  const passwordHash = await hashPassword(input.password);

  return prisma.user.create({
    data: {
      username,
      email,
      passwordHash,
      profile: {
        create: {
          nickname,
        },
      },
    },
    select: userSelect,
  });
}

export async function checkAuthAvailability(input: {
  username?: string;
  email?: string;
  nickname?: string;
}) {
  const username = input.username?.trim().toLowerCase();
  const email = input.email?.trim().toLowerCase();
  const nickname = input.nickname?.trim();

  const [user, profile] = await Promise.all([
    username || email
      ? prisma.user.findFirst({
          where: {
            OR: [
              ...(username ? [{ username }] : []),
              ...(email ? [{ email }] : []),
            ],
          },
          select: {
            username: true,
            email: true,
          },
        })
      : null,
    nickname
      ? prisma.profile.findFirst({
          where: { nickname },
          select: { id: true },
        })
      : null,
  ]);

  return {
    username: username
      ? {
          value: username,
          available: user?.username !== username,
        }
      : undefined,
    email: email
      ? {
          value: email,
          available: user?.email !== email,
        }
      : undefined,
    nickname: nickname
      ? {
          value: nickname,
          available: !profile,
        }
      : undefined,
  };
}

export async function login(input: LoginInput) {
  const identifier = input.identifier.trim().toLowerCase();
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username: identifier }, { email: identifier }],
    },
    include: {
      profile: true,
    },
  });

  if (!user) {
    throw new AppError("아이디 또는 비밀번호가 올바르지 않습니다.", 401);
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new AppError(
      "로그인 실패가 반복되어 계정이 잠시 잠겼습니다. 잠시 후 다시 시도해 주세요.",
      429,
    );
  }

  const isValidPassword = await verifyPassword(input.password, user.passwordHash);

  if (!isValidPassword) {
    const nextFailedAttempts = user.failedLoginAttempts + 1;
    const shouldLock = nextFailedAttempts >= MAX_LOGIN_ATTEMPTS;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: nextFailedAttempts,
        lockedUntil: shouldLock
          ? new Date(Date.now() + LOGIN_LOCK_MINUTES * 60 * 1000)
          : null,
      },
    });

    if (shouldLock) {
      throw new AppError(
        "로그인 실패가 반복되어 계정이 잠시 잠겼습니다. 15분 후 다시 시도해 주세요.",
        429,
      );
    }

    throw new AppError("아이디 또는 비밀번호가 올바르지 않습니다.", 401);
  }

  if (user.failedLoginAttempts > 0 || user.lockedUntil) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  }

  if (user.status !== "ACTIVE") {
    throw new AppError("활성 상태가 아닌 계정입니다. 관리자에게 문의해 주세요.", 403);
  }

  return getUserById(user.id);
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userSelect,
  });

  if (!user) {
    throw new AppError("사용자를 찾을 수 없습니다.", 404);
  }

  return user;
}
