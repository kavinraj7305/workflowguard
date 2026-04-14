import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { ticketActivityEvents } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { getDeveloperTicket } from "@/lib/workflow-access";
import { TaskActions } from "@/components/workspace/TaskActions";
import { summarizeTicketActivity } from "@/lib/ticket-analytics";

type Props = { params: Promise<{ assignmentId: string }> };

const priorityConfig: Record<
  string,
  { label: string; bg: string; text: string; bar: string }
> = {
  urgent: {
    label: "Urgent",
    bg: "bg-red-500/10",
    text: "text-red-400",
    bar: "bg-red-500",
  },
  high: {
    label: "High",
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    bar: "bg-orange-500",
  },
  medium: {
    label: "Medium",
    bg: "bg-yellow-500/10",
    text: "text-yellow-400",
    bar: "bg-yellow-500",
  },
  low: {
    label: "Low",
    bg: "bg-green-500/10",
    text: "text-green-400",
    bar: "bg-green-500",
  },
};

const statusConfig: Record<
  string,
  { label: string; dot: string; text: string; bg: string }
> = {
  open: { label: "Open", dot: "bg-blue-400", text: "text-blue-400", bg: "bg-blue-500/10" },
  in_progress: { label: "In progress", dot: "bg-amber-400", text: "text-amber-400", bg: "bg-amber-500/10" },
  testing: { label: "Testing", dot: "bg-violet-400", text: "text-violet-400", bg: "bg-violet-500/10" },
  closed: { label: "Closed", dot: "bg-emerald-400", text: "text-emerald-400", bg: "bg-emerald-500/10" },
};

export default async function WorkspaceDashboardPage({ params }: Props) {
  const { assignmentId } = await params;
  const session = await getSession();
  if (!session || session.role !== "developer") {
    redirect("/login");
  }

  const row = await getDeveloperTicket(assignmentId, session.orgId, session.sub);
  if (!row) {
    redirect("/employee");
  }
  if (!row.ticket.allowedApps.includes("dashboard")) {
    redirect(`/workspace/${assignmentId}/${row.ticket.allowedApps[0] ?? "profile"}`);
  }

  const events = await db()
    .select()
    .from(ticketActivityEvents)
    .where(eq(ticketActivityEvents.ticketId, assignmentId))
    .orderBy(desc(ticketActivityEvents.createdAt));
  const summary = summarizeTicketActivity(events);

  const priority = priorityConfig[row.ticket.priority] ?? priorityConfig.medium;
  const status = statusConfig[row.ticket.status] ?? statusConfig.open;

  // Productivity ring
  const score = summary.productivityScore ?? 0;
  const ringRadius = 36;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const scorePercent = Math.min(100, Math.max(0, score));
  const ringOffset = ringCircumference * (1 - scorePercent / 100);

  let scoreColor = "#6366f1";
  let scoreBg = "bg-indigo-500/10";
  let scoreText = "text-indigo-400";
  if (scorePercent >= 75) {
    scoreColor = "#10b981";
    scoreBg = "bg-emerald-500/10";
    scoreText = "text-emerald-400";
  } else if (scorePercent >= 50) {
    scoreColor = "#f59e0b";
    scoreBg = "bg-amber-500/10";
    scoreText = "text-amber-400";
  } else if (scorePercent < 30) {
    scoreColor = "#ef4444";
    scoreBg = "bg-red-500/10";
    scoreText = "text-red-400";
  }

  return (
    <div className="space-y-6">
      {/* Ticket info bar */}
      <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status badge */}
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${status.bg} ${status.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
          {/* Priority badge */}
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${priority.bg} ${priority.text}`}>
            {priority.label} priority
          </span>
          {/* Apps */}
          <span className="text-xs text-zinc-500">
            Approved apps: {row.ticket.allowedApps.join(", ")}
          </span>
        </div>
        <p className="mt-3 text-sm text-zinc-400">
          Work only in the approved app tabs listed by HR. When done, attach a
          screenshot and move to testing.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Productivity ring */}
        <div className={`rounded-2xl border border-white/8 ${scoreBg} p-5 flex items-center gap-4`}>
          <div className="relative shrink-0">
            <svg width="88" height="88" viewBox="0 0 88 88" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="44" cy="44" r={ringRadius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
              <circle
                cx="44"
                cy="44"
                r={ringRadius}
                fill="none"
                stroke={scoreColor}
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                style={{ transition: "stroke-dashoffset 1s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-sm font-bold tabular-nums ${scoreText}`}>
                {scorePercent}
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Productivity
            </p>
            <p className={`mt-1 text-lg font-bold ${scoreText}`}>
              {summary.performanceLabel}
            </p>
          </div>
        </div>

        {/* Status */}
        <div className={`rounded-2xl border border-white/8 ${status.bg} p-5`}>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Status
          </p>
          <p className={`mt-2 text-2xl font-bold capitalize ${status.text}`}>
            {status.label}
          </p>
          <div className={`mt-2 h-0.5 w-full rounded-full bg-white/8`}>
            <div
              className={`h-0.5 rounded-full ${status.dot.replace("bg-", "bg-")}`}
              style={{
                width:
                  row.ticket.status === "open"
                    ? "25%"
                    : row.ticket.status === "in_progress"
                      ? "60%"
                      : row.ticket.status === "testing"
                        ? "85%"
                        : "100%",
              }}
            />
          </div>
        </div>

        {/* Resources used */}
        <div className="rounded-2xl border border-white/8 bg-cyan-500/8 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Resources used
          </p>
          <p className="mt-2 text-2xl font-bold text-cyan-400 tabular-nums">
            {summary.uniqueResources}
          </p>
          <p className="mt-1 text-xs text-zinc-500">unique resources</p>
        </div>

        {/* Paths visited */}
        <div className="rounded-2xl border border-white/8 bg-violet-500/8 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Paths visited
          </p>
          <p className="mt-2 text-2xl font-bold text-violet-400 tabular-nums">
            {summary.uniquePaths ?? 0}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {summary.uniquePaths ? "unique paths tracked" : "No activity yet"}
          </p>
        </div>
      </div>

      {/* Activity summary */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
            Activity breakdown
          </p>
          <div className="space-y-3">
            {[
              { label: "Page views", value: summary.pageViews, color: "bg-indigo-500" },
              { label: "Idle starts", value: summary.idleStarts, color: "bg-amber-500" },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-zinc-400">{item.label}</span>
                  <span className="text-xs font-semibold text-white tabular-nums">
                    {item.value}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/8">
                  <div
                    className={`h-1.5 rounded-full ${item.color} transition-all`}
                    style={{
                      width: item.value > 0 ? `${Math.min(100, item.value * 8)}%` : "0%",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
            Focus mode
          </p>
          <p className="text-sm text-white">{summary.performanceLabel}</p>
          <p className="mt-2 text-xs text-zinc-500">
            Use the Pomodoro timer above to build focused work sessions. Each
            session is tracked and contributes to your productivity score.
          </p>
        </div>
      </div>

      <TaskActions ticketId={assignmentId} />
    </div>
  );
}
