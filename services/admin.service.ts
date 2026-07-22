import {
  AdminActionType,
  Prisma,
  ProductVisibility,
  ReportStatus,
  UserStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";

const adminUserSelect = {
  id: true,
  username: true,
  email: true,
  role: true,
  status: true,
  reportCount: true,
  createdAt: true,
  profile: {
    select: {
      nickname: true,
      region: true,
    },
  },
  _count: {
    select: {
      products: true,
      buyerTransactions: true,
      sellerTransactions: true,
      reportsReceived: true,
    },
  },
} satisfies Prisma.UserSelect;

const adminProductSelect = {
  id: true,
  title: true,
  price: true,
  region: true,
  status: true,
  visibility: true,
  reportCount: true,
  createdAt: true,
  seller: {
    select: {
      id: true,
      username: true,
      profile: {
        select: {
          nickname: true,
        },
      },
    },
  },
  category: {
    select: {
      name: true,
      slug: true,
    },
  },
} satisfies Prisma.ProductSelect;

const adminReportSelect = {
  id: true,
  targetType: true,
  targetUserId: true,
  targetProductId: true,
  reason: true,
  detail: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  reporter: {
    select: {
      id: true,
      username: true,
      profile: {
        select: {
          nickname: true,
        },
      },
    },
  },
  targetUser: {
    select: {
      id: true,
      username: true,
      status: true,
      reportCount: true,
      profile: {
        select: {
          nickname: true,
        },
      },
    },
  },
  targetProduct: {
    select: {
      id: true,
      title: true,
      visibility: true,
      reportCount: true,
    },
  },
} satisfies Prisma.ReportSelect;

const adminTransactionSelect = {
  id: true,
  amount: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  product: {
    select: {
      id: true,
      title: true,
      status: true,
      visibility: true,
    },
  },
  buyer: {
    select: {
      id: true,
      username: true,
      profile: {
        select: {
          nickname: true,
        },
      },
    },
  },
  seller: {
    select: {
      id: true,
      username: true,
      profile: {
        select: {
          nickname: true,
        },
      },
    },
  },
  payment: {
    select: {
      id: true,
      amount: true,
      method: true,
      status: true,
      paidAt: true,
      refundedAt: true,
    },
  },
} satisfies Prisma.TransactionSelect;

const adminActionSelect = {
  id: true,
  actionType: true,
  targetType: true,
  targetId: true,
  reason: true,
  createdAt: true,
  admin: {
    select: {
      id: true,
      username: true,
      profile: {
        select: {
          nickname: true,
        },
      },
    },
  },
} satisfies Prisma.AdminActionSelect;

export type AdminUserItem = Prisma.UserGetPayload<{ select: typeof adminUserSelect }>;
export type AdminProductItem = Prisma.ProductGetPayload<{ select: typeof adminProductSelect }>;
export type AdminReportItem = Prisma.ReportGetPayload<{ select: typeof adminReportSelect }>;
export type AdminTransactionItem = Prisma.TransactionGetPayload<{
  select: typeof adminTransactionSelect;
}>;
export type AdminActionItem = Prisma.AdminActionGetPayload<{
  select: typeof adminActionSelect;
}>;

function sanitizeReason(reason?: string) {
  return reason?.trim() || null;
}

async function createAdminAction(
  admin: SessionUser,
  actionType: AdminActionType,
  targetType: string,
  targetId: string,
  reason?: string,
) {
  await prisma.adminAction.create({
    data: {
      adminId: admin.id,
      actionType,
      targetType,
      targetId,
      reason: sanitizeReason(reason),
    },
  });
}

export async function getAdminDashboard() {
  const [
    users,
    suspendedUsers,
    dormantUsers,
    visibleProducts,
    blockedProducts,
    pendingReports,
    openInquiries,
    transactions,
    paidTransactions,
  ] = await prisma.$transaction([
    prisma.user.count(),
    prisma.user.count({ where: { status: "SUSPENDED" } }),
    prisma.user.count({ where: { status: "DORMANT" } }),
    prisma.product.count({ where: { visibility: "VISIBLE" } }),
    prisma.product.count({ where: { visibility: "BLOCKED" } }),
    prisma.report.count({ where: { status: { in: ["PENDING", "REVIEWING"] } } }),
    prisma.inquiry.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.transaction.count(),
    prisma.transaction.count({ where: { status: { in: ["PAID", "COMPLETED"] } } }),
  ]);

  return {
    users,
    suspendedUsers,
    dormantUsers,
    visibleProducts,
    blockedProducts,
    pendingReports,
    openInquiries,
    transactions,
    paidTransactions,
  };
}

export async function listAdminUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: adminUserSelect,
  });
}

export async function updateAdminUserStatus(
  admin: SessionUser,
  userId: string,
  status: UserStatus,
  reason?: string,
) {
  if (admin.id === userId && status !== "ACTIVE") {
    throw new AppError("자기 자신의 관리자 계정은 비활성화할 수 없습니다.", 400);
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, status: true },
  });

  if (!target || target.status === "DELETED") {
    throw new AppError("사용자를 찾을 수 없습니다.", 404);
  }

  const actionType =
    status === "SUSPENDED"
      ? "USER_SUSPEND"
      : status === "DORMANT"
        ? "USER_MARK_DORMANT"
        : "USER_RESTORE";

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: { status },
      select: adminUserSelect,
    });

    await tx.adminAction.create({
      data: {
        adminId: admin.id,
        actionType,
        targetType: "USER",
        targetId: userId,
        reason: sanitizeReason(reason),
      },
    });

    return user;
  });
}

export async function listAdminProducts() {
  return prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    select: adminProductSelect,
  });
}

export async function updateAdminProductVisibility(
  admin: SessionUser,
  productId: string,
  visibility: ProductVisibility,
  reason?: string,
) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });

  if (!product) {
    throw new AppError("상품을 찾을 수 없습니다.", 404);
  }

  const actionType =
    visibility === "DELETED"
      ? "PRODUCT_DELETE"
      : visibility === "BLOCKED"
        ? "PRODUCT_BLOCK"
        : "PRODUCT_HIDE";

  return prisma.$transaction(async (tx) => {
    const updated = await tx.product.update({
      where: { id: productId },
      data: { visibility },
      select: adminProductSelect,
    });

    await tx.adminAction.create({
      data: {
        adminId: admin.id,
        actionType,
        targetType: "PRODUCT",
        targetId: productId,
        reason: sanitizeReason(reason),
      },
    });

    return updated;
  });
}

export async function listAdminReports() {
  return prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    select: adminReportSelect,
  });
}

export async function updateAdminReportStatus(
  admin: SessionUser,
  reportId: string,
  status: ReportStatus,
  reason?: string,
) {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    select: { id: true, targetType: true, targetUserId: true, targetProductId: true },
  });

  if (!report) {
    throw new AppError("신고 내역을 찾을 수 없습니다.", 404);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.report.update({
      where: { id: reportId },
      data: { status },
      select: adminReportSelect,
    });

    await tx.adminAction.create({
      data: {
        adminId: admin.id,
        actionType: "REPORT_RESOLVE",
        targetType: "REPORT",
        targetId: reportId,
        reason: sanitizeReason(reason) ?? `신고 상태 변경: ${status}`,
      },
    });

    return updated;
  });
}

export async function listAdminTransactions() {
  return prisma.transaction.findMany({
    orderBy: { updatedAt: "desc" },
    select: adminTransactionSelect,
  });
}

export async function listAdminActions() {
  return prisma.adminAction.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: adminActionSelect,
  });
}

export async function recordAdminTransactionUpdate(
  admin: SessionUser,
  transactionId: string,
  reason?: string,
) {
  await createAdminAction(
    admin,
    "TRANSACTION_UPDATE",
    "TRANSACTION",
    transactionId,
    reason,
  );
}
