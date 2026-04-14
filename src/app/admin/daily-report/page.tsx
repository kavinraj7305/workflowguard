"use client";

export default function AdminDailyReportPage() {
  const metrics = [
    { label: "Tickets Opened", value: 4, trend: "+1", up: false },
    { label: "Tickets Closed", value: 7, trend: "+3", up: true },
    { label: "Avg Handoff Time", value: "2.4h", trend: "-0.7h", up: true },
    { label: "QA Confidence", value: "92%", trend: "+5%", up: true },
  ];

  return (
    <div className="mx-auto max-w-4xl rounded-2xl border border-white/8 bg-white p-10 text-zinc-900 shadow-2xl">
      <div className="border-b border-zinc-200 pb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Auto-generated daily report</p>
        <h1 className="mt-1 text-3xl font-bold">WorkflowGuard Daily Operations Summary</h1>
        <p className="mt-2 text-sm text-zinc-600">Prepared for supervisor review</p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl border border-zinc-200 p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">{m.label}</p>
            <div className="mt-1 flex items-center justify-between">
              <p className="text-2xl font-bold">{m.value}</p>
              <span className={`text-sm font-semibold ${m.up ? "text-emerald-600" : "text-rose-600"}`}>
                {m.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-7 rounded-xl bg-zinc-100 p-4">
        <p className="text-sm font-semibold">Highlights</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-700">
          <li>Team maintained strong closure momentum throughout the day.</li>
          <li>Testing queue was processed faster than previous reporting period.</li>
          <li>No critical blockers detected in handoff flow.</li>
        </ul>
      </div>
    </div>
  );
}

