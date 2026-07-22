"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { csrfFetch } from "@/lib/csrf-client";

type ProfileFormProps = {
  initialValue: {
    nickname: string;
    region?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
  };
};

export function ProfileForm({ initialValue }: ProfileFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(initialValue.avatarUrl ?? "");
  const [previewUrl, setPreviewUrl] = useState(initialValue.avatarUrl ?? "");

  async function uploadAvatar(file: File) {
    const uploadFormData = new FormData();
    uploadFormData.append("file", file);

    const response = await csrfFetch("/api/uploads/profile-image", {
      method: "POST",
      body: uploadFormData,
    });
    const result = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(result?.message ?? "프로필 이미지 업로드에 실패했습니다.");
    }

    const uploadedUrl = result?.data?.url;

    if (typeof uploadedUrl !== "string") {
      throw new Error("프로필 이미지 업로드 응답이 올바르지 않습니다.");
    }

    return uploadedUrl;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const currentPassword = String(formData.get("currentPassword") ?? "");
    const newPassword = String(formData.get("newPassword") ?? "");
    const imageFile = formData.get("avatarFile");

    try {
      const nextAvatarUrl =
        imageFile instanceof File && imageFile.size > 0
          ? await uploadAvatar(imageFile)
          : avatarUrl || null;

      const response = await csrfFetch("/api/users/me", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          nickname: String(formData.get("nickname") ?? "").trim(),
          region: String(formData.get("region") ?? "").trim() || null,
          bio: String(formData.get("bio") ?? "").trim() || null,
          avatarUrl: nextAvatarUrl,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setMessage(result?.message ?? "프로필을 수정하지 못했습니다.");
        return;
      }

      setAvatarUrl(nextAvatarUrl ?? "");
      setPreviewUrl(nextAvatarUrl ?? "");
      setMessage("저장되었습니다.");
      router.push("/my?profile=updated");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "프로필을 수정하지 못했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <label className="grid gap-2 text-sm font-medium text-slate-800">
        닉네임
        <input
          name="nickname"
          defaultValue={initialValue.nickname}
          className="rounded-md border border-slate-300 bg-white px-3 py-2"
          required
          minLength={2}
          maxLength={30}
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-800">
        지역
        <input
          name="region"
          defaultValue={initialValue.region ?? ""}
          className="rounded-md border border-slate-300 bg-white px-3 py-2"
          maxLength={80}
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-800">
        프로필 이미지
        <input
          ref={fileInputRef}
          name="avatarFile"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="field file:mr-4 file:rounded-xl file:border-0 file:bg-brand-secondary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-primary"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];

            if (!file) {
              setPreviewUrl(avatarUrl);
              return;
            }

            setPreviewUrl(URL.createObjectURL(file));
          }}
        />
        <span className="text-xs font-normal text-slate-500">
          jpg, png, webp 파일만 가능하며 최대 5MB까지 업로드할 수 있습니다.
        </span>
      </label>
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-secondary text-sm font-semibold text-brand-primary">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="프로필 이미지 미리보기"
                className="h-full w-full object-cover"
              />
            ) : (
              "이미지"
            )}
          </div>
          <p className="text-sm text-slate-600">
            저장 버튼을 누르면 선택한 이미지가 프로필에 반영됩니다.
          </p>
        </div>
        {previewUrl || avatarUrl ? (
          <button
            type="button"
            className="btn-secondary border-red-100 text-red-600 hover:border-red-200 hover:bg-red-50"
            onClick={() => {
              setAvatarUrl("");
              setPreviewUrl("");

              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }}
          >
            이미지 삭제
          </button>
        ) : null}
      </div>
      <label className="grid gap-2 text-sm font-medium text-slate-800">
        소개
        <textarea
          name="bio"
          defaultValue={initialValue.bio ?? ""}
          className="min-h-28 rounded-md border border-slate-300 bg-white px-3 py-2"
          maxLength={500}
        />
      </label>
      <div className="grid gap-3 border-t border-slate-200 pt-5">
        <label className="grid gap-2 text-sm font-medium text-slate-800">
          현재 비밀번호
          <input
            name="currentPassword"
            type="password"
            className="rounded-md border border-slate-300 bg-white px-3 py-2"
            minLength={8}
            autoComplete="current-password"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-800">
          새 비밀번호
          <input
            name="newPassword"
            type="password"
            className="rounded-md border border-slate-300 bg-white px-3 py-2"
            minLength={8}
            autoComplete="new-password"
          />
        </label>
      </div>
      {message ? <p className="text-sm text-market-coral">{message}</p> : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-market-leaf px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isSubmitting ? "저장 중" : "프로필 저장"}
      </button>
    </form>
  );
}
