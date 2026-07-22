import { Prisma, ProductStatus, TransactionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { hasBlockRelation } from "@/services/block.service";

const transactionSelect = {
  id: true,
  productId: true,
  buyerId: true,
  sellerId: true,
  amount: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  product: {
    select: {
      id: true,
      title: true,
      price: true,
      status: true,
      visibility: true,
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
      createdAt: true,
    },
  },
} satisfies Prisma.TransactionSelect;

export type TransactionDetail = Prisma.TransactionGetPayload<{
  select: typeof transactionSelect;
}>;

export function isTransactionActionRequiredForUser(
  transaction: Pick<TransactionDetail, "buyerId" | "sellerId" | "status">,
  user: Pick<SessionUser, "id" | "role">,
) {
  if (user.role === "ADMIN") {
    return transaction.status === "REQUESTED";
  }

  if (transaction.sellerId === user.id && transaction.status === "REQUESTED") {
    return true;
  }

  if (
    transaction.buyerId === user.id &&
    ["ACCEPTED", "PAYMENT_PENDING"].includes(transaction.status)
  ) {
    return true;
  }

  if (transaction.sellerId === user.id && transaction.status === "PAID") {
    return true;
  }

  return false;
}

function assertTransactionParticipant(
  user: SessionUser,
  transaction: { buyerId: string; sellerId: string },
) {
  if (
    user.role !== "ADMIN" &&
    user.id !== transaction.buyerId &&
    user.id !== transaction.sellerId
  ) {
    throw new AppError("거래를 조회할 권한이 없습니다.", 403);
  }
}

type TransactionActor = "BUYER" | "SELLER" | "PARTICIPANT";

type TransactionTransitionRule = {
  actor: TransactionActor;
  allowedFrom: TransactionStatus[];
  authorizationMessage: string;
  invalidStateMessage: string;
  productStatus?: ProductStatus;
};

const transactionTransitionRules: Partial<
  Record<TransactionStatus, TransactionTransitionRule>
> = {
  ACCEPTED: {
    actor: "SELLER",
    allowedFrom: ["REQUESTED"],
    authorizationMessage: "판매자만 거래 요청을 수락할 수 있습니다.",
    invalidStateMessage: "요청 상태의 거래만 수락할 수 있습니다.",
    productStatus: "RESERVED",
  },
  REJECTED: {
    actor: "SELLER",
    allowedFrom: ["REQUESTED"],
    authorizationMessage: "판매자만 거래 요청을 거절할 수 있습니다.",
    invalidStateMessage: "요청 상태의 거래만 거절할 수 있습니다.",
  },
  PAYMENT_PENDING: {
    actor: "BUYER",
    allowedFrom: ["ACCEPTED"],
    authorizationMessage: "구매자만 결제 대기로 변경할 수 있습니다.",
    invalidStateMessage: "수락된 거래만 결제 대기로 변경할 수 있습니다.",
  },
  COMPLETED: {
    actor: "SELLER",
    allowedFrom: ["PAID"],
    authorizationMessage: "판매자만 거래 완료 처리할 수 있습니다.",
    invalidStateMessage: "결제 완료된 거래만 완료 처리할 수 있습니다.",
    productStatus: "SOLD",
  },
  CANCELED: {
    actor: "PARTICIPANT",
    allowedFrom: ["REQUESTED", "ACCEPTED", "PAYMENT_PENDING"],
    authorizationMessage: "거래 당사자만 취소할 수 있습니다.",
    invalidStateMessage: "현재 상태에서는 거래를 취소할 수 없습니다.",
  },
};

function canApplyTransition(
  actor: TransactionActor,
  user: SessionUser,
  transaction: { buyerId: string; sellerId: string },
) {
  if (user.role === "ADMIN") {
    return true;
  }

  if (actor === "BUYER") {
    return user.id === transaction.buyerId;
  }

  if (actor === "SELLER") {
    return user.id === transaction.sellerId;
  }

  return user.id === transaction.buyerId || user.id === transaction.sellerId;
}

export async function createTransaction(user: SessionUser, productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      sellerId: true,
      price: true,
      status: true,
      visibility: true,
    },
  });

  if (!product || product.visibility !== "VISIBLE") {
    throw new AppError("거래할 상품을 찾을 수 없습니다.", 404);
  }

  if (product.sellerId === user.id) {
    throw new AppError("자신의 상품에는 거래를 요청할 수 없습니다.", 400);
  }

  if (product.status === "SOLD") {
    throw new AppError("이미 거래가 완료된 상품입니다.", 409);
  }

  if (await hasBlockRelation(user.id, product.sellerId)) {
    throw new AppError("차단 관계가 있는 사용자와는 거래할 수 없습니다.", 403);
  }

  const existing = await prisma.transaction.findFirst({
    where: {
      productId,
      buyerId: user.id,
      status: {
        in: ["REQUESTED", "ACCEPTED", "PAYMENT_PENDING", "PAID"],
      },
    },
    select: transactionSelect,
  });

  if (existing) {
    return { transaction: existing, created: false };
  }

  const transaction = await prisma.transaction.create({
    data: {
      productId,
      buyerId: user.id,
      sellerId: product.sellerId,
      amount: product.price,
    },
    select: transactionSelect,
  });

  return { transaction, created: true };
}

export async function listTransactions(user: SessionUser) {
  return prisma.transaction.findMany({
    where:
      user.role === "ADMIN"
        ? {}
        : {
            OR: [{ buyerId: user.id }, { sellerId: user.id }],
          },
    orderBy: { updatedAt: "desc" },
    select: transactionSelect,
  });
}

export async function countTransactionNotifications(user: SessionUser) {
  if (user.role === "ADMIN") {
    return prisma.transaction.count({
      where: {
        status: "REQUESTED",
      },
    });
  }

  return prisma.transaction.count({
    where: {
      OR: [
        {
          sellerId: user.id,
          status: "REQUESTED",
        },
        {
          buyerId: user.id,
          status: {
            in: ["ACCEPTED", "PAYMENT_PENDING"],
          },
        },
        {
          sellerId: user.id,
          status: "PAID",
        },
      ],
    },
  });
}

export async function getTransaction(user: SessionUser, transactionId: string) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    select: transactionSelect,
  });

  if (!transaction) {
    throw new AppError("거래를 찾을 수 없습니다.", 404);
  }

  assertTransactionParticipant(user, transaction);

  return transaction;
}

export async function updateTransactionStatus(
  user: SessionUser,
  transactionId: string,
  nextStatus: TransactionStatus,
) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    select: {
      id: true,
      buyerId: true,
      sellerId: true,
      productId: true,
      status: true,
    },
  });

  if (!transaction) {
    throw new AppError("거래를 찾을 수 없습니다.", 404);
  }

  assertTransactionParticipant(user, transaction);

  const rule = transactionTransitionRules[nextStatus];

  if (!rule) {
    throw new AppError("지원하지 않는 거래 상태입니다.", 400);
  }

  if (!canApplyTransition(rule.actor, user, transaction)) {
    throw new AppError(rule.authorizationMessage, 403);
  }

  if (!rule.allowedFrom.includes(transaction.status)) {
    throw new AppError(rule.invalidStateMessage, 400);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.transaction.update({
      where: { id: transactionId },
      data: { status: nextStatus },
      select: transactionSelect,
    });

    if (rule.productStatus) {
      await tx.product.update({
        where: { id: transaction.productId },
        data: { status: rule.productStatus },
      });
    }

    return updated;
  });
}
