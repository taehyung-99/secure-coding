import { z } from "zod";
import { sanitizeUserText } from "@/lib/sanitize";

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);
const sanitizedString = (schema: z.ZodString) =>
  z.string().transform(sanitizeUserText).pipe(schema);
const profileImageUrlSchema = z
  .string()
  .max(500)
  .refine(
    (value) =>
      /^\/uploads\/profiles\/[a-f0-9-]+\.(jpg|png|webp)$/.test(value) ||
      z.string().url().safeParse(value).success,
    "이미지 URL 형식이 올바르지 않습니다.",
  );

export const passwordComplexitySchema = z
  .string()
  .min(8, "비밀번호는 8자 이상이어야 합니다.")
  .max(100)
  .regex(/[A-Za-z]/, "비밀번호에는 영문자가 포함되어야 합니다.")
  .regex(/[0-9]/, "비밀번호에는 숫자가 포함되어야 합니다.")
  .regex(/[^A-Za-z0-9]/, "비밀번호에는 특수문자가 포함되어야 합니다.");

export const signupSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  password: passwordComplexitySchema,
  confirmPassword: z.string().min(8).max(100).optional(),
  nickname: sanitizedString(z.string().min(2).max(30)),
}).refine(
  (data) => !data.confirmPassword || data.password === data.confirmPassword,
  {
    message: "비밀번호 확인이 일치하지 않습니다.",
    path: ["confirmPassword"],
  },
);

export const loginSchema = z.object({
  identifier: sanitizedString(z.string().min(3).max(255)),
  password: z.string().min(8).max(100),
});

export const updateProfileSchema = z.object({
  nickname: sanitizedString(z.string().min(2).max(30)).optional(),
  region: sanitizedString(z.string().min(1).max(80)).nullable().optional(),
  bio: sanitizedString(z.string().max(500)).nullable().optional(),
  avatarUrl: profileImageUrlSchema.nullable().optional(),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(8).max(100),
  newPassword: passwordComplexitySchema,
});

export const updateMeSchema = updateProfileSchema
  .extend({
    currentPassword: z.string().min(8).max(100).optional(),
    newPassword: passwordComplexitySchema.optional(),
  })
  .refine(
    (data) =>
      (!data.currentPassword && !data.newPassword) ||
      Boolean(data.currentPassword && data.newPassword),
    {
      message: "비밀번호 변경 시 현재 비밀번호와 새 비밀번호를 모두 입력해야 합니다.",
      path: ["newPassword"],
    },
  );

export const reportSchema = z.object({
  targetType: z.enum(["USER", "PRODUCT"]),
  targetUserId: z.string().cuid().optional(),
  targetProductId: z.string().cuid().optional(),
  reason: sanitizedString(z.string().min(2).max(100)),
  detail: sanitizedString(z.string().max(1000)).optional(),
}).refine(
  (data) =>
    (data.targetType === "USER" && Boolean(data.targetUserId) && !data.targetProductId) ||
    (data.targetType === "PRODUCT" && Boolean(data.targetProductId) && !data.targetUserId),
  {
    message: "신고 대상 정보가 올바르지 않습니다.",
  },
);

export const reportReasonSchema = z.object({
  reason: sanitizedString(z.string().min(2).max(100)),
  detail: sanitizedString(z.string().max(1000)).optional(),
});

export const productStatusSchema = z.enum(["ON_SALE", "RESERVED", "SOLD"]);

export const productImageInputSchema = z.object({
  url: z.string().min(1).max(500),
  altText: sanitizedString(z.string().max(120)).nullable().optional(),
  sortOrder: z.number().int().min(0).max(20).optional(),
});

export const createProductSchema = z.object({
  title: sanitizedString(z.string().min(2).max(80)),
  description: sanitizedString(z.string().min(5).max(2000)),
  price: z.number().int().min(0).max(2_000_000_000),
  categoryId: z.string().cuid().nullable().optional(),
  region: sanitizedString(z.string().min(1).max(80)),
  images: z.array(productImageInputSchema).max(5).optional(),
});

export const updateProductSchema = createProductSchema.partial().refine(
  (data) => Object.values(data).some((value) => value !== undefined),
  {
    message: "수정할 상품 정보를 입력해 주세요.",
  },
);

export const updateProductStatusSchema = z.object({
  status: productStatusSchema,
});

export const productListQuerySchema = z.object({
  q: z.preprocess(emptyToUndefined, sanitizedString(z.string().max(80)).optional()),
  category: z.preprocess(emptyToUndefined, z.string().max(80).optional()),
  region: z.preprocess(emptyToUndefined, sanitizedString(z.string().max(80)).optional()),
  status: z.preprocess(emptyToUndefined, productStatusSchema.optional()),
  sort: z.preprocess(
    emptyToUndefined,
    z.enum(["latest", "price_asc", "price_desc", "view_desc", "view_asc"]).default("latest"),
  ),
  seller: z.preprocess(emptyToUndefined, z.enum(["me"]).optional()),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export const authAvailabilityQuerySchema = z.object({
  username: z.preprocess(emptyToUndefined, z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional()),
  email: z.preprocess(emptyToUndefined, z.string().email().optional()),
  nickname: z.preprocess(emptyToUndefined, sanitizedString(z.string().min(2).max(30)).optional()),
}).refine((data) => Boolean(data.username || data.email || data.nickname), {
  message: "확인할 값을 입력해 주세요.",
});

export const verifyPasswordSchema = z.object({
  password: z.string().min(8).max(100),
});

export const createChatRoomSchema = z
  .object({
    productId: z.string().cuid().optional(),
    targetUserId: z.string().cuid().optional(),
  })
  .refine((data) => Boolean(data.productId || data.targetUserId), {
    message: "상품 또는 대화할 사용자를 선택해 주세요.",
  });

export const createMessageSchema = z.object({
  content: sanitizedString(z.string().min(1).max(1000)),
});

export const userSearchQuerySchema = z.object({
  q: sanitizedString(z.string().min(1).max(50)),
});

export const createTransactionSchema = z.object({
  productId: z.string().cuid(),
});

export const transactionStatusSchema = z.enum([
  "ACCEPTED",
  "REJECTED",
  "PAYMENT_PENDING",
  "COMPLETED",
  "CANCELED",
]);

export const updateTransactionStatusSchema = z.object({
  status: transactionStatusSchema,
  reason: sanitizedString(z.string().max(500)).optional(),
});

export const mockPaymentSchema = z.object({
  transactionId: z.string().cuid(),
});

export const adminUserStatusSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED", "DORMANT"]),
  reason: sanitizedString(z.string().max(500)).optional(),
});

export const adminProductVisibilitySchema = z.object({
  visibility: z.enum(["VISIBLE", "HIDDEN", "BLOCKED", "DELETED"]),
  reason: sanitizedString(z.string().max(500)).optional(),
});

export const adminReportStatusSchema = z.object({
  status: z.enum(["PENDING", "REVIEWING", "RESOLVED", "REJECTED"]),
  reason: sanitizedString(z.string().max(500)).optional(),
});

export const createInquirySchema = z.object({
  title: sanitizedString(z.string().min(2).max(120)),
  content: sanitizedString(z.string().min(5).max(2000)),
});

export const adminInquiryStatusSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "ANSWERED", "CLOSED"]),
  adminReply: sanitizedString(z.string().max(2000)).nullable().optional(),
});
