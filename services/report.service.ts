import { Prisma, ReportTargetType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";

const AUTO_SANCTION_THRESHOLD = 3;

type CreateReportInput = {
  targetType: ReportTargetType;
  targetUserId?: string;
  targetProductId?: string;
  reason: string;
  detail?: string;
};

const reportSelect = {
  id: true,
  targetType: true,
  targetUserId: true,
  targetProductId: true,
  reason: true,
  detail: true,
  status: true,
  createdAt: true,
} satisfies Prisma.ReportSelect;

export type ReportSummary = Prisma.ReportGetPayload<{
  select: typeof reportSelect;
}>;

export async function createReport(reporterId: string, input: CreateReportInput) {
  if (input.targetType === "USER") {
    return reportUser(reporterId, input);
  }

  return reportProduct(reporterId, input);
}

async function reportUser(reporterId: string, input: CreateReportInput) {
  const targetUserId = input.targetUserId;

  if (!targetUserId) {
    throw new AppError("신고할 사용자를 선택해 주세요.", 400);
  }

  if (reporterId === targetUserId) {
    throw new AppError("자기 자신은 신고할 수 없습니다.", 400);
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, status: true },
  });

  if (!targetUser || targetUser.status === "DELETED") {
    throw new AppError("신고할 사용자를 찾을 수 없습니다.", 404);
  }

  const duplicate = await prisma.report.findFirst({
    where: {
      reporterId,
      targetType: "USER",
      targetUserId,
    },
    select: { id: true },
  });

  if (duplicate) {
    throw new AppError("이미 신고한 사용자입니다.", 409);
  }

  return prisma.$transaction(async (tx) => {
    const report = await tx.report.create({
      data: {
        reporterId,
        targetType: "USER",
        targetUserId,
        reason: input.reason.trim(),
        detail: input.detail?.trim() || null,
      },
      select: reportSelect,
    });

    const updatedUser = await tx.user.update({
      where: { id: targetUserId },
      data: { reportCount: { increment: 1 } },
      select: { reportCount: true, status: true },
    });

    if (
      updatedUser.reportCount >= AUTO_SANCTION_THRESHOLD &&
      updatedUser.status === "ACTIVE"
    ) {
      await tx.user.update({
        where: { id: targetUserId },
        data: { status: "DORMANT" },
      });
    }

    return report;
  });
}

async function reportProduct(reporterId: string, input: CreateReportInput) {
  const targetProductId = input.targetProductId;

  if (!targetProductId) {
    throw new AppError("신고할 상품을 선택해 주세요.", 400);
  }

  const product = await prisma.product.findUnique({
    where: { id: targetProductId },
    select: { id: true, sellerId: true, visibility: true },
  });

  if (!product || product.visibility === "DELETED") {
    throw new AppError("신고할 상품을 찾을 수 없습니다.", 404);
  }

  if (product.sellerId === reporterId) {
    throw new AppError("자신의 상품은 신고할 수 없습니다.", 400);
  }

  const duplicate = await prisma.report.findFirst({
    where: {
      reporterId,
      targetType: "PRODUCT",
      targetProductId,
    },
    select: { id: true },
  });

  if (duplicate) {
    throw new AppError("이미 신고한 상품입니다.", 409);
  }

  return prisma.$transaction(async (tx) => {
    const report = await tx.report.create({
      data: {
        reporterId,
        targetType: "PRODUCT",
        targetProductId,
        reason: input.reason.trim(),
        detail: input.detail?.trim() || null,
      },
      select: reportSelect,
    });

    const updatedProduct = await tx.product.update({
      where: { id: targetProductId },
      data: { reportCount: { increment: 1 } },
      select: { reportCount: true, visibility: true },
    });

    if (
      updatedProduct.reportCount >= AUTO_SANCTION_THRESHOLD &&
      updatedProduct.visibility === "VISIBLE"
    ) {
      await tx.product.update({
        where: { id: targetProductId },
        data: { visibility: "BLOCKED" },
      });
    }

    return report;
  });
}
