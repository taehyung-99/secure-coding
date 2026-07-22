export type ApiErrorResponse = {
  message: string;
  code?: string;
};

export type ApiSuccessResponse<T> = {
  data: T;
};

export type ProductListItem = {
  id: string;
  title: string;
  price: number;
  region: string;
  status: "ON_SALE" | "RESERVED" | "SOLD";
  thumbnailUrl: string | null;
  createdAt: string;
};
