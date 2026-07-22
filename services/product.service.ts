import { Prisma, ProductStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import {
  getBlockedRelationUserIds,
  hasBlockRelation,
} from "@/services/block.service";

type ProductImageInput = {
  url: string;
  altText?: string | null;
  sortOrder?: number;
};

type CreateProductInput = {
  title: string;
  description: string;
  price: number;
  categoryId?: string | null;
  region: string;
  images?: ProductImageInput[];
};

type UpdateProductInput = Partial<CreateProductInput>;

type ProductListInput = {
  q?: string;
  category?: string;
  region?: string;
  status?: ProductStatus;
  sort: "latest" | "price_asc" | "price_desc" | "view_desc" | "view_asc";
  seller?: "me";
  page: number;
  pageSize: number;
};

const productListSelect = {
  id: true,
  title: true,
  price: true,
  region: true,
  status: true,
  visibility: true,
  reportCount: true,
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
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
} satisfies Prisma.ProductSelect;

const productDetailSelect = {
  id: true,
  title: true,
  description: true,
  price: true,
  region: true,
  status: true,
  visibility: true,
  reportCount: true,
  viewCount: true,
  createdAt: true,
  updatedAt: true,
  sellerId: true,
  seller: {
    select: {
      id: true,
      username: true,
      profile: {
        select: {
          nickname: true,
          region: true,
          avatarUrl: true,
        },
      },
    },
  },
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  images: {
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      url: true,
      altText: true,
      sortOrder: true,
    },
  },
} satisfies Prisma.ProductSelect;

export type ProductListItem = Prisma.ProductGetPayload<{
  select: typeof productListSelect;
}>;

export type ProductDetail = Prisma.ProductGetPayload<{
  select: typeof productDetailSelect;
}>;

function assertCanManageProduct(user: SessionUser, sellerId: string) {
  if (user.role !== "ADMIN" && user.id !== sellerId) {
    throw new AppError("상품을 수정할 권한이 없습니다.", 403);
  }
}

function normalizeImages(images?: ProductImageInput[]) {
  return (images ?? []).map((image, index) => ({
    url: image.url.trim(),
    altText: image.altText?.trim() || null,
    sortOrder: image.sortOrder ?? index,
  }));
}

export async function listProducts(input: ProductListInput, user?: SessionUser | null) {
  const where: Prisma.ProductWhereInput = {
    visibility: "VISIBLE",
  };

  if (user) {
    const blockedUserIds = await getBlockedRelationUserIds(user.id);

    if (blockedUserIds.length > 0) {
      where.sellerId = { notIn: blockedUserIds };
    }
  }

  if (input.q) {
    where.title = {
      contains: input.q.trim(),
      mode: "insensitive",
    };
  }

  if (input.status) {
    where.status = input.status;
  }

  if (input.region) {
    where.region = {
      contains: input.region.trim(),
      mode: "insensitive",
    };
  }

  if (input.category) {
    where.category = {
      OR: [{ id: input.category }, { slug: input.category }],
    };
  }

  if (input.seller === "me") {
    if (!user) {
      throw new AppError("로그인이 필요합니다.", 401);
    }

    where.sellerId = user.id;
    delete where.visibility;
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    input.sort === "price_asc"
      ? { price: "asc" }
      : input.sort === "price_desc"
        ? { price: "desc" }
        : input.sort === "view_desc"
          ? { viewCount: "desc" }
          : input.sort === "view_asc"
            ? { viewCount: "asc" }
            : { createdAt: "desc" };

  const skip = (input.page - 1) * input.pageSize;
  const [items, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: input.pageSize,
      select: productListSelect,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items: items.map((item) => ({
      ...item,
      thumbnailUrl: item.images[0]?.url ?? null,
    })),
    page: input.page,
    pageSize: input.pageSize,
    total,
  };
}

export async function getProductDetail(productId: string, user?: SessionUser | null) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: productDetailSelect,
  });

  if (!product || product.visibility === "DELETED") {
    throw new AppError("상품을 찾을 수 없습니다.", 404);
  }

  const canManage = Boolean(user && (user.role === "ADMIN" || user.id === product.sellerId));

  if (product.visibility !== "VISIBLE" && !canManage) {
    throw new AppError("상품을 찾을 수 없습니다.", 404);
  }

  if (
    user &&
    !canManage &&
    (await hasBlockRelation(user.id, product.sellerId))
  ) {
    throw new AppError("차단된 사용자의 상품입니다.", 403);
  }

  if (canManage) {
    return {
      ...product,
      canManage,
    };
  }

  const viewedProduct = await prisma.product.update({
    where: { id: productId },
    data: {
      viewCount: {
        increment: 1,
      },
    },
    select: productDetailSelect,
  });

  return {
    ...viewedProduct,
    canManage,
  };
}

export async function createProduct(sellerId: string, input: CreateProductInput) {
  if (input.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: input.categoryId },
      select: { id: true },
    });

    if (!category) {
      throw new AppError("존재하지 않는 카테고리입니다.", 400);
    }
  }

  return prisma.product.create({
    data: {
      sellerId,
      title: input.title.trim(),
      description: input.description.trim(),
      price: input.price,
      categoryId: input.categoryId || null,
      region: input.region.trim(),
      images: {
        create: normalizeImages(input.images),
      },
    },
    select: productDetailSelect,
  });
}

export async function updateProduct(
  productId: string,
  user: SessionUser,
  input: UpdateProductInput,
) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { sellerId: true, visibility: true },
  });

  if (!product || product.visibility === "DELETED") {
    throw new AppError("상품을 찾을 수 없습니다.", 404);
  }

  assertCanManageProduct(user, product.sellerId);

  if (input.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: input.categoryId },
      select: { id: true },
    });

    if (!category) {
      throw new AppError("존재하지 않는 카테고리입니다.", 400);
    }
  }

  return prisma.$transaction(async (tx) => {
    if (input.images !== undefined) {
      await tx.productImage.deleteMany({
        where: { productId },
      });
    }

    return tx.product.update({
      where: { id: productId },
      data: {
        ...(input.title !== undefined ? { title: input.title.trim() } : {}),
        ...(input.description !== undefined
          ? { description: input.description.trim() }
          : {}),
        ...(input.price !== undefined ? { price: input.price } : {}),
        ...(input.categoryId !== undefined
          ? { categoryId: input.categoryId || null }
          : {}),
        ...(input.region !== undefined ? { region: input.region.trim() } : {}),
        ...(input.images !== undefined
          ? { images: { create: normalizeImages(input.images) } }
          : {}),
      },
      select: productDetailSelect,
    });
  });
}

export async function updateProductStatus(
  productId: string,
  user: SessionUser,
  status: ProductStatus,
) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { sellerId: true, visibility: true },
  });

  if (!product || product.visibility === "DELETED") {
    throw new AppError("상품을 찾을 수 없습니다.", 404);
  }

  assertCanManageProduct(user, product.sellerId);

  return prisma.product.update({
    where: { id: productId },
    data: { status },
    select: productDetailSelect,
  });
}

export async function deleteProduct(productId: string, user: SessionUser) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { sellerId: true, visibility: true },
  });

  if (!product || product.visibility === "DELETED") {
    throw new AppError("상품을 찾을 수 없습니다.", 404);
  }

  assertCanManageProduct(user, product.sellerId);

  await prisma.product.update({
    where: { id: productId },
    data: { visibility: "DELETED" },
  });
}
