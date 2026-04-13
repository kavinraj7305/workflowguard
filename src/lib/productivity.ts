import type { InferSelectModel } from "drizzle-orm";
import { engagementEvents } from "@/db/schema";
import { pathMatchesAllowed } from "@/lib/url-match";

type EngagementEventRow = InferSelectModel<typeof engagementEvents>;

export type ProductivityResult = {
  score: number;
  classification: "engaged" | "distracted" | "idle";
  details: Record<string, unknown>;
};

const HEARTBEAT_SEC = 30;

/**
 * Derives a score and label from engagement events + task URL context.
 * Uses multiple signals (idle, on-task heartbeats, completion) — not a single metric.
 */
export function computeProductivity(
  events: EngagementEventRow[],
  allowedPatterns: string[]
): ProductivityResult {
  if (events.length === 0) {
    return {
      score: 0,
      classification: "idle",
      details: { reason: "no_events" },
    };
  }

  const sorted = [...events].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  );
  const first = sorted[0]!.createdAt.getTime();
  const last = sorted[sorted.length - 1]!.createdAt.getTime();
  const spanSec = Math.max(1, (last - first) / 1000);

  let idleSec = 0;
  let idleOpen: number | null = null;
  for (const e of sorted) {
    if (e.eventType === "idle_start") {
      idleOpen = e.createdAt.getTime();
    } else if (e.eventType === "idle_end" && idleOpen !== null) {
      idleSec += Math.max(0, (e.createdAt.getTime() - idleOpen) / 1000);
      idleOpen = null;
    }
  }
  if (idleOpen !== null) {
    idleSec += Math.max(0, (last - idleOpen) / 1000);
  }

  let onTaskHeartbeats = 0;
  let offTaskHeartbeats = 0;
  for (const e of sorted) {
    if (e.eventType !== "heartbeat") continue;
    const path = typeof e.pathOrUrl === "string" ? e.pathOrUrl : "";
    const allowed =
      e.payload &&
      typeof e.payload === "object" &&
      "onTask" in e.payload &&
      typeof (e.payload as { onTask?: unknown }).onTask === "boolean"
        ? (e.payload as { onTask: boolean }).onTask
        : pathMatchesAllowed(path, allowedPatterns);
    if (allowed) onTaskHeartbeats += 1;
    else offTaskHeartbeats += 1;
  }

  const onTaskSec = onTaskHeartbeats * HEARTBEAT_SEC;
  const offTaskSec = offTaskHeartbeats * HEARTBEAT_SEC;
  const idleRatio = Math.min(1, idleSec / spanSec);
  const heartbeatTotal = onTaskHeartbeats + offTaskHeartbeats;
  const deviationRatio =
    heartbeatTotal > 0 ? offTaskHeartbeats / heartbeatTotal : 1;

  const completed = sorted.some((e) => e.eventType === "task_complete");

  let score = Math.round(
    100 *
      (0.45 * (1 - idleRatio) +
        0.45 * (1 - deviationRatio) +
        0.1 * (completed ? 1 : 0))
  );
  score = Math.max(0, Math.min(100, score));

  let classification: ProductivityResult["classification"] = "engaged";
  if (idleRatio > 0.45) classification = "idle";
  else if (deviationRatio > 0.35 || offTaskHeartbeats > onTaskHeartbeats)
    classification = "distracted";

  return {
    score,
    classification,
    details: {
      spanSec,
      idleSec,
      idleRatio,
      onTaskHeartbeats,
      offTaskHeartbeats,
      deviationRatio,
      completed,
    },
  };
}
