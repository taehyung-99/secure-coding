import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
  message?: string;
};

export const rateLimitPolicies = {
  chatMessage: {
    limit: 20,
    windowMs: 60 * 1000,
    message: "메시지를 너무 빠르게 보내고 있습니다. 잠시 후 다시 시도해 주세요.",
  },
  report: {
    limit: 5,
    windowMs: 60 * 60 * 1000,
    message: "신고 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  },
  uploadImage: {
    limit: 30,
    windowMs: 10 * 60 * 1000,
    message: "이미지 업로드 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  },
  websocketConnection: {
    limit: 30,
    windowMs: 60 * 1000,
    message: "실시간 채팅 연결 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  },
} as const;

export async function assertRateLimit({
  key,
  limit,
  windowMs,
  message = "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
}: RateLimitOptions) {
  const now = new Date();
  const existing = await prisma.rateLimit.findUnique({
    where: { key },
  });

  if (!existing) {
    await prisma.rateLimit.create({
      data: {
        key,
        count: 1,
        windowStart: now,
      },
    });
    return;
  }

  const windowAge = now.getTime() - existing.windowStart.getTime();

  if (windowAge >= windowMs) {
    await prisma.rateLimit.update({
      where: { key },
      data: {
        count: 1,
        windowStart: now,
      },
    });
    return;
  }

  if (existing.count >= limit) {
    throw new AppError(message, 429);
  }

  await prisma.rateLimit.update({
    where: { key },
    data: {
      count: {
        increment: 1,
      },
    },
  });
}
