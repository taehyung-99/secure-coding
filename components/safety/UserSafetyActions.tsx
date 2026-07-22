"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiRequest } from "@/lib/api-client";

type UserSafetyActionsProps = {
  targetUserId: string;
  canAct: boolean;
  blockLabel?: string;
  unblockLabel?: string;
  initialBlocked?: boolean;
};

export function UserSafetyActions({
  targetUserId,
  canAct,
  blockLabel = "판매자 차단",
  unblockLabel = "차단 해제",
  initialBlocked = false,
}: UserSafetyActionsProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBlocked, setIsBlocked] = useState(initialBlocked);

  if (!canAct) {
    return null;
  }

  async function submitReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    try {
      await apiRequest(
        `/api/users/${targetUserId}/report`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason: String(formData.get("reason") ?? "").trim(),
            detail: String(formData.get("detail") ?? "").trim() || undefined,
          }),
        },
        "사용자 신고를 접수하지 못했습니다.",
      );

      event.currentTarget.reset();
      setMessage("사용자 신고가 접수되었습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "사용자 신고를 접수하지 못했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleBlock() {
    setIsSubmitting(true);
    setMessage(null);

    const nextBlocked = !isBlocked;
    const fallbackMessage = isBlocked
      ? "차단을 해제하지 못했습니다."
      : "사용자를 차단하지 못했습니다.";

    try {
      await apiRequest(
        `/api/users/${targetUserId}/block`,
        { method: isBlocked ? "DELETE" : "POST" },
        fallbackMessage,
      );

      setIsBlocked(nextBlocked);
      setMessage(nextBlocked ? "사용자를 차단했습니다." : "차단을 해제했습니다.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : fallbackMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="surface grid gap-4 p-4">
      <div>
        <p className="text-sm font-bold text-brand-text">안전 액션</p>
        <p className="mt-1 text-xs leading-5 text-gray-500">
          불편한 사용자는 조용히 차단하거나 운영자에게 신고할 수 있습니다.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={toggleBlock}
          disabled={isSubmitting}
          className="btn-secondary"
        >
          {isBlocked ? unblockLabel : blockLabel}
        </button>

        <button
          type="button"
          onClick={() => setIsReportOpen((current) => !current)}
          className="btn-danger"
        >
          사용자 신고
        </button>
      </div>

      {isReportOpen ? (
        <form onSubmit={submitReport} className="grid gap-3 rounded-2xl bg-brand-background p-4">
          <h2 className="text-base font-bold text-brand-text">사용자 신고</h2>
          <select
            name="reason"
            className="field"
            required
            defaultValue=""
          >
            <option value="" disabled>
              신고 사유 선택
            </option>
            <option value="비매너 또는 욕설">비매너 또는 욕설</option>
            <option value="사기 의심">사기 의심</option>
            <option value="스팸 또는 광고">스팸 또는 광고</option>
            <option value="기타">기타</option>
          </select>
          <textarea
            name="detail"
            placeholder="상세 내용을 작성해 주세요."
            className="field min-h-24"
            maxLength={1000}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-danger justify-center bg-white"
          >
            {isSubmitting ? "접수 중" : "신고 접수"}
          </button>
        </form>
      ) : null}

      {message ? <p className="rounded-xl bg-brand-secondary px-3 py-2 text-sm font-medium text-brand-primary">{message}</p> : null}
    </div>
  );
}
