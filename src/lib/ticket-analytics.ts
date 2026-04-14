import type { InferSelectModel } from "drizzle-orm";
import type { ticketActivityEvents } from "@/db/schema";

type ActivityEvent = InferSelectModel<typeof ticketActivityEvents>;

export function summarizeTicketActivity(events: ActivityEvent[]) {
  let sessionStarts = 0;
  let sessionEnds = 0;
  let pageViews = 0;
  let resourceUses = 0;
  let siteVisits = 0;
  let idleStarts = 0;
  let idleEnds = 0;
  let heartbeats = 0;

  const paths = new Set<string>();
  const resources = new Set<string>();

  for (const event of events) {
    if (event.pathOrUrl) {
      paths.add(event.pathOrUrl);
    }
    if (event.resourceName) {
      resources.add(event.resourceName);
    }
    switch (event.eventType) {
      case "session_start":
        sessionStarts += 1;
        break;
      case "session_end":
        sessionEnds += 1;
        break;
      case "page_view":
        pageViews += 1;
        break;
      case "resource_use":
        resourceUses += 1;
        break;
      case "site_visit":
        siteVisits += 1;
        break;
      case "idle_start":
        idleStarts += 1;
        break;
      case "idle_end":
        idleEnds += 1;
        break;
      case "heartbeat":
        heartbeats += 1;
        break;
      default:
        break;
    }
  }

  const activeScore = Math.min(100, Math.round(pageViews * 7 + resourceUses * 4 + sessionStarts * 10 + heartbeats * 2));
  const idlePenalty = Math.min(35, idleStarts * 8);
  const productivityScore = Math.max(0, activeScore - idlePenalty);

  return {
    sessionStarts,
    sessionEnds,
    pageViews,
    resourceUses,
    siteVisits,
    idleStarts,
    idleEnds,
    heartbeats,
    uniquePaths: paths.size,
    uniqueResources: resources.size,
    productivityScore,
    performanceLabel:
      productivityScore >= 80 ? "high" : productivityScore >= 55 ? "steady" : "needs focus",
  };
}