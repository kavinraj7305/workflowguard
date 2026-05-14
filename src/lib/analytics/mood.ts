export function moodFromWorkload(load: number) {
  if (load >= 4) {
    return { label: "Overloaded", style: "bg-rose-500/15 text-rose-300 border border-rose-500/25" };
  }
  if (load >= 2) {
    return { label: "Busy", style: "bg-amber-500/15 text-amber-300 border border-amber-500/25" };
  }
  return { label: "Calm", style: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25" };
}
