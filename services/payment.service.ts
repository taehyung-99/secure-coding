import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { getTransaction } from "@/services/transaction.service";

const paymentSelect = {
  id: true,
  transactionId: true,
  amount: true,
  method: true,
  status: true,
  paidAt: true,
  refundedAt: true,
  createdAt: true,
  transaction: {
    select: {
      id: true,
      buyerId: true,
      sellerId: true,
      productId: true,
      amount: true,
      status: true,
    },
  },
};

export async function createMockPayment(user: SessionUser, transactionId: string) {
  const transaction = await getTransaction(user, transactionId);

  if (transaction.buyerId !== user.id && user.role !== "ADMIN") {
    throw new AppError("구매자만 결제할 수 있습니다.", 403);
  }

  if (!["ACCEPTED", "PAYMENT_PENDING"].includes(transaction.status)) {
    throw new AppError("수락되었거나 결제 대기 상태인 거래만 결제할 수 있습니다.", 400);
  }

  return prisma.$transaction(async (tx) => {
    const latest = await tx.transaction.findUnique({
      where: { id: transactionId },
      select: {
        id: true,
        amount: true,
        status: true,
        payment: { select: { id: true } },
      },
    });

    if (!latest) {
      throw new AppError("거래를 찾을 수 없습니다.", 404);
    }

    if (latest.payment) {
      throw new AppError("이미 결제된 거래입니다.", 409);
    }

    if (!["ACCEPTED", "PAYMENT_PENDING"].includes(latest.status)) {
      throw new AppError("현재 상태에서는 결제할 수 없습니다.", 400);
    }

    const payment = await tx.payment.create({
      data: {
        transactionId,
        amount: latest.amount,
        method: "MOCK",
        status: "PAID",
        paidAt: new Date(),
      },
      select: paymentSelect,
    });

    await tx.transaction.update({
      where: { id: transactionId },
      data: { status: "PAID" },
    });

    return payment;
  });
}

export async function getPayment(user: SessionUser, paymentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: paymentSelect,
  });

  if (!payment) {
    throw new AppError("결제 내역을 찾을 수 없습니다.", 404);
  }

  if (
    user.role !== "ADMIN" &&
    user.id !== payment.transaction.buyerId &&
    user.id !== payment.transaction.sellerId
  ) {
    throw new AppError("결제 내역을 조회할 권한이 없습니다.", 403);
  }

  return payment;
}
