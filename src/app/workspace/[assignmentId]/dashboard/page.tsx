import { TaskActions } from "@/components/workspace/TaskActions";

type Props = { params: Promise<{ assignmentId: string }> };

export default async function WorkspaceDashboardPage({ params }: Props) {
  const { assignmentId } = await params;
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Customer data</h2>
      <p className="text-zinc-600 dark:text-zinc-400">
        Simulated task area: review records, update fields, and save changes. Your
        engagement is inferred from navigation and activity on task-related
        pages—not from arbitrary site labels.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-500">Open items</p>
          <p className="mt-2 text-3xl font-semibold">12</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-500">Completed today</p>
          <p className="mt-2 text-3xl font-semibold">5</p>
        </div>
      </div>
      <TaskActions assignmentId={assignmentId} />
    </div>
  );
}
