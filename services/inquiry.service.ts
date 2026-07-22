import { InquiryStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";

const inquirySelect = {
  id: true,
  title: true,
  content: true,
  status: true,
  adminReply: true,
  createdAt: true,
  updatedAt: true,
  user: {
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
} satisfies Prisma.InquirySelect;

export type InquiryItem = Prisma.InquiryGetPayload<{ select: typeof inquirySelect }>;

type CreateInquiryInput = {
  title: string;
  content: string;
};

type UpdateInquiryInput = {
  status: InquiryStatus;
  adminReply?: string | null;
};

export async function createInquiry(userId: string, input: CreateInquiryInput) {
  return prisma.inquiry.create({
    data: {
      userId,
      title: input.title.trim(),
      content: input.content.trim(),
    },
    select: inquirySelect,
  });
}

export async function listMyInquiries(userId: string) {
  return prisma.inquiry.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: inquirySelect,
  });
}

export async function listAdminInquiries() {
  return prisma.inquiry.findMany({
    orderBy: [
      { status: "asc" },
      { createdAt: "desc" },
    ],
    select: inquirySelect,
  });
}

export async function countAdminInquiryNotifications() {
  return prisma.inquiry.count({
    where: {
      status: {
        in: ["OPEN", "IN_PROGRESS"],
      },
    },
  });
}

export async function updateAdminInquiry(inquiryId: string, input: UpdateInquiryInput) {
  const inquiry = await prisma.inquiry.findUnique({
    where: { id: inquiryId },
    select: { id: true },
  });

  if (!inquiry) {
    throw new AppError("문의 내역을 찾을 수 없습니다.", 404);
  }

  return prisma.inquiry.update({
    where: { id: inquiryId },
    data: {
      status: input.status,
      adminReply: input.adminReply?.trim() || null,
    },
    select: inquirySelect,
  });
}
