"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { csrfFetch } from "@/lib/csrf-client";

type CategoryOption = {
  id: string;
  name: string;
};

type ProductFormInitialValue = {
  id?: string;
  title?: string;
  description?: string;
  price?: number;
  region?: string;
  categoryId?: string | null;
  imageUrl?: string | null;
};

type ProductFormProps = {
  categories: CategoryOption[];
  initialValue?: ProductFormInitialValue;
  mode: "create" | "edit";
};

export function ProductForm({
  categories,
  initialValue,
  mode,
}: ProductFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState(initialValue?.imageUrl ?? "");
  const [previewUrl, setPreviewUrl] = useState(initialValue?.imageUrl ?? "");

  async function uploadImage(file: File) {
    const uploadFormData = new FormData();
    uploadFormData.append("file", file);

    const response = await csrfFetch("/api/uploads/product-image", {
      method: "POST",
      body: uploadFormData,
    });
    const result = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(result?.message ?? "이미지 업로드에 실패했습니다.");
    }

    const uploadedUrl = result?.data?.url;

    if (typeof uploadedUrl !== "string") {
      throw new Error("이미지 업로드 응답이 올바르지 않습니다.");
    }

    return uploadedUrl;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const formData = new FormData(event.currentTarget);

    try {
      const imageFile = formData.get("imageFile");
      const uploadedImageUrl =
        imageFile instanceof File && imageFile.size > 0
          ? await uploadImage(imageFile)
          : imageUrl.trim();

      const payload = {
        title: String(formData.get("title") ?? "").trim(),
        description: String(formData.get("description") ?? "").trim(),
        price: Number(formData.get("price") ?? 0),
        region: String(formData.get("region") ?? "").trim(),
        categoryId: String(formData.get("categoryId") ?? "") || null,
        images: uploadedImageUrl
          ? [{ url: uploadedImageUrl, altText: "상품 이미지" }]
          : [],
      };

      const endpoint =
        mode === "create"
          ? "/api/products"
          : `/api/products/${initialValue?.id ?? ""}`;

      const response = await csrfFetch(endpoint, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setMessage(result?.message ?? "상품을 저장하지 못했습니다.");
        return;
      }

      const productId = result?.data?.id;

      if (productId) {
        setImageUrl(uploadedImageUrl);
        setPreviewUrl(uploadedImageUrl);
        router.push(`/products/${productId}`);
        router.refresh();
        return;
      }

      setMessage("상품이 저장되었습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "상품을 저장하지 못했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <label className="grid gap-2 text-sm font-medium text-slate-800">
        상품명
        <input
          name="title"
          defaultValue={initialValue?.title ?? ""}
          className="field"
          required
          minLength={2}
          maxLength={80}
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-slate-800">
        가격
        <input
          name="price"
          type="number"
          min={0}
          defaultValue={initialValue?.price ?? 0}
          className="field"
          required
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-slate-800">
        카테고리
        <select
          name="categoryId"
          defaultValue={initialValue?.categoryId ?? ""}
          className="field"
        >
          <option value="">선택 안 함</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2 text-sm font-medium text-slate-800">
        판매 지역
        <input
          name="region"
          defaultValue={initialValue?.region ?? ""}
          className="field"
          required
          maxLength={80}
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-slate-800">
        상품 이미지
        <input
          ref={fileInputRef}
          name="imageFile"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="field file:mr-4 file:rounded-xl file:border-0 file:bg-brand-secondary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-primary"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];

            if (!file) {
              setPreviewUrl(imageUrl);
              return;
            }

            setPreviewUrl(URL.createObjectURL(file));
          }}
        />
        <span className="text-xs font-normal text-slate-500">
          jpg, png, webp 파일만 가능하며 최대 5MB까지 업로드할 수 있습니다.
        </span>
      </label>

      {previewUrl ? (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="상품 이미지 미리보기"
              className="h-56 w-full object-cover"
            />
            <button
              type="button"
              className="absolute right-3 top-3 rounded-xl border border-red-100 bg-white/95 px-3 py-2 text-sm font-semibold text-red-600 shadow-card hover:border-red-200 hover:bg-red-50"
              onClick={() => {
                setImageUrl("");
                setPreviewUrl("");

                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
            >
              이미지 삭제
            </button>
          </div>
        </div>
      ) : null}

      <label className="grid gap-2 text-sm font-medium text-slate-800">
        설명
        <textarea
          name="description"
          defaultValue={initialValue?.description ?? ""}
          className="field min-h-40"
          required
          minLength={5}
          maxLength={2000}
        />
      </label>

      {message ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{message}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary"
      >
        {isSubmitting ? "저장 중" : mode === "create" ? "상품 등록" : "상품 수정"}
      </button>
    </form>
  );
}
