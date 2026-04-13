export default function WorkspaceProfilePage() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Profile &amp; settings</h2>
      <p className="text-zinc-600 dark:text-zinc-400">
        Mock profile view. Moving between Dashboard, Profile, and Analytics counts
        as in-task navigation when those paths match patterns HR configured for
        this assignment.
      </p>
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <label className="block text-sm font-medium">Display name</label>
        <p className="mt-1 text-zinc-800 dark:text-zinc-200">Demo Employee</p>
      </div>
    </div>
  );
}
