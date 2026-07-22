import type { SessionUser } from "@/lib/auth";

export function canManageProduct(user: SessionUser | null, sellerId: string) {
  return Boolean(user && (user.role === "ADMIN" || user.id === sellerId));
}

export function canAccessAdmin(user: SessionUser | null) {
  return user?.role === "ADMIN" && user.status === "ACTIVE";
}
