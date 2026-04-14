"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

type Props = {
  ticketId: string;
  blockedUrlPatterns: string[];
};

export function WorkspaceActivityTracker({ ticketId, blockedUrlPatterns }: Props) {
  const pathname = usePathname();
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleRef = useRef(false);
  const seenResourcesRef = useRef(new Set<string>());

  const send = useCallback(
    async (body: Record<string, unknown>) => {
      try {
        await fetch(`/api/tickets/${ticketId}/activity`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } catch {
        // Ignore telemetry failures.
      }
    },
    [ticketId]
  );

  useEffect(() => {
    void send({ eventType: "session_start", pathOrUrl: pathname });
    void send({ eventType: "page_view", pathOrUrl: pathname });
  }, [pathname, send]);

  useEffect(() => {
    const scanResources = () => {
      for (const entry of performance.getEntriesByType("resource")) {
        const resource = entry as PerformanceResourceTiming;
        if (seenResourcesRef.current.has(resource.name)) {
          continue;
        }
        seenResourcesRef.current.add(resource.name);
        void send({
          eventType: "resource_use",
          resourceName: resource.name,
          metadata: {
            initiatorType: resource.initiatorType,
            duration: Math.round(resource.duration),
          },
        });
      }
    };

    scanResources();
    const interval = window.setInterval(scanResources, 20_000);
    return () => window.clearInterval(interval);
  }, [send]);

  useEffect(() => {
    const markActive = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        if (!idleRef.current) {
          idleRef.current = true;
          void send({ eventType: "idle_start", pathOrUrl: pathname });
        }
      }, 45_000);
    };

    const wake = () => {
      if (idleRef.current) {
        idleRef.current = false;
        void send({ eventType: "idle_end", pathOrUrl: pathname });
      }
      markActive();
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        void send({ eventType: "session_end", pathOrUrl: pathname });
      } else {
        void send({ eventType: "session_start", pathOrUrl: pathname });
      }
    };

    markActive();
    window.addEventListener("mousemove", wake);
    window.addEventListener("keydown", wake);
    window.addEventListener("scroll", wake, true);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("mousemove", wake);
      window.removeEventListener("keydown", wake);
      window.removeEventListener("scroll", wake, true);
      document.removeEventListener("visibilitychange", onVisibility);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      void send({ eventType: "session_end", pathOrUrl: pathname });
    };
  }, [pathname, send]);

  useEffect(() => {
    const current = window.location.pathname;
    if (blockedUrlPatterns.some((pattern) => current.includes(pattern))) {
      void send({ eventType: "site_visit", pathOrUrl: current, metadata: { blocked: true } });
    }
  }, [blockedUrlPatterns, send]);

  return null;
}