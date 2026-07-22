"use client";

import { useEffect, useRef, type ReactNode } from "react";

type ScrollableMessagesProps = {
  children: ReactNode;
  scrollKey: string;
};

export function ScrollableMessages({
  children,
  scrollKey,
}: ScrollableMessagesProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    container.scrollTop = container.scrollHeight;
  }, [scrollKey]);

  return (
    <div
      ref={containerRef}
      className="h-[52vh] min-h-[360px] max-h-[620px] overflow-y-auto overscroll-contain bg-white p-4"
    >
      <div className="flex min-h-full flex-col justify-end gap-4">
        {children}
      </div>
    </div>
  );
}
