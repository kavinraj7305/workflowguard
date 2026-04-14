"use client";

type Props = {
  title: string;
  hint: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function BeautifulEmptyState({ title, hint, actionLabel, onAction }: Props) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-white/3 p-8 text-center">
      <div className="pointer-events-none absolute -top-10 -left-10 h-28 w-28 rounded-full bg-indigo-500/20 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-8 -right-10 h-24 w-24 rounded-full bg-cyan-500/20 blur-2xl" />
      <div className="relative">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/15">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="h-6 w-6 text-indigo-300">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-1 text-sm text-zinc-400">{hint}</p>
        {actionLabel && onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

