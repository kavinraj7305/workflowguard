"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Org = { id: string; name: string; slug: string };

export default function AdminOrgSettingsPage() {
  const [org, setOrg] = useState<Org | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/orgs");
      const data = res.ok ? ((await res.json()) as { orgs: Org[] }) : { orgs: [] };
      setOrg(data.orgs[0] ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Company</h2>
        <p className="mt-2 text-sm text-zinc-400">
          You are looking at one tenant. Need another legal entity with its own HR login? That happens on the onboarding
          page — each company needs its own HR email.
        </p>
      </div>

      {org ? (
        <div className="rounded-2xl border border-white/10 bg-white/3 p-6">
          <p className="text-xs text-zinc-500">Legal / display name</p>
          <p className="mt-1 text-lg font-semibold text-white">{org.name}</p>
          <p className="mt-4 text-xs text-zinc-500">URL slug</p>
          <p className="mt-1 font-mono text-sm text-zinc-300">{org.slug}</p>
        </div>
      ) : (
        <p className="text-sm text-rose-300">Could not load organization.</p>
      )}

      <Link href="/setup" className="inline-flex text-sm text-indigo-300 hover:text-indigo-200">
        Set up another company →
      </Link>
    </div>
  );
}
