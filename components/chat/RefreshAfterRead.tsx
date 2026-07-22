"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

type RefreshAfterReadProps = {
  refreshKey: string;
};

export function RefreshAfterRead({ refreshKey }: RefreshAfterReadProps) {
  const router = useRouter();

  useEffect(() => {
    router.refresh();
  }, [refreshKey, router]);

  return null;
}
