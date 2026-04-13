"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

const HEARTBEAT_MS = 30_000;
const IDLE_MS = 60_000;

type Props = { assignmentId: string };

export function EngagementTracker({ assignmentId }: Props) {
  const pathname = usePathname();
  const idleRef = useRef(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const send = useCallback(
    async (
      eventType:
        | "heartbeat"
        | "page_view"
        | "idle_start"
        | "idle_end"
        | "navigation"
        | "task_complete",
      path: string
    ) => {
      try {
        await fetch(`/api/assignments/${assignmentId}/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventType, pathOrUrl: path }),
        });
      } catch {
        /* ignore network errors in demo */
      }
    },
    [assignmentId]
  );

  useEffect(() => {
    void send("page_view", pathname);
  }, [pathname, send]);

  useEffect(() => {
    const tick = () => void send("heartbeat", pathname);
    tick();
    const id = setInterval(tick, HEARTBEAT_MS);
    return () => clearInterval(id);
  }, [pathname, send]);

  useEffect(() => {
    const markActive = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        if (!idleRef.current) {
          idleRef.current = true;
          void send("idle_start", pathname);
        }
      }, IDLE_MS);
    };

    const wake = () => {
      if (idleRef.current) {
        idleRef.current = false;
        void send("idle_end", pathname);
      }
      markActive();
    };

    markActive();
    window.addEventListener("mousemove", wake);
    window.addEventListener("keydown", wake);
    window.addEventListener("scroll", wake, true);
    return () => {
      window.removeEventListener("mousemove", wake);
      window.removeEventListener("keydown", wake);
      window.removeEventListener("scroll", wake, true);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [pathname, send]);

  return null;
}
