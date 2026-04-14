"use client";

import { useCallback, useEffect, useState } from "react";
import { demoOrgs } from "@/lib/demo/mock-data";
import { BeautifulEmptyState } from "@/components/admin/BeautifulEmptyState";

type Org = { id: string; name: string; slug: string };

const inputClass =
  "w-full rounded-xl border border-zinc-700/60 bg-zinc-900/60 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-colors";

export default function AdminOrgsPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [orgName, setOrgName] = useState("Acme Studio");
  const [orgSlug, setOrgSlug] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/orgs");
      if (res.ok) {
        const data = (await res.json()) as { orgs: Org[] };
        if (data.orgs.length === 0) {
          setOrgs(demoOrgs as Org[]);
        } else {
          setOrgs(data.orgs);
        }
      } else {
        setOrgs(demoOrgs as Org[]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createOrg(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const res = await fetch("/api/orgs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: orgName, slug: orgSlug || undefined }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Could not create org");
      return;
    }
    setMessage("Organization created successfully.");
    setOrgSlug("");
    await load();
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {/* ── Create org form ─────────────────────────────────── */}
      <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/15">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-4 w-4 text-indigo-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-white">Create organization</h2>
        </div>
        <p className="mb-5 text-sm text-zinc-400">
          Add a new organization to the platform. Each org has its own isolated team and tickets.
        </p>

        <form onSubmit={createOrg} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Organization name
            </label>
            <input
              className={inputClass}
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="e.g. Acme Studio"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Slug <span className="text-zinc-600 normal-case font-normal">(optional — auto-generated if blank)</span>
            </label>
            <input
              className={inputClass}
              value={orgSlug}
              onChange={(e) => setOrgSlug(e.target.value)}
              placeholder="e.g. acme-studio"
            />
          </div>

          {message && (
            <p className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
              {message}
            </p>
          )}
          {error && (
            <p className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500"
          >
            Create organization
          </button>
        </form>
      </div>

      {/* ── Organizations list ──────────────────────────────── */}
      <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-white">All organizations</h2>
          <span className="rounded-full bg-indigo-500/15 px-2.5 py-0.5 text-xs font-semibold text-indigo-300">
            {orgs.length} total
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          </div>
        ) : orgs.length > 0 ? (
          <div className="space-y-3">
            {orgs.map((org) => (
              <div
                key={org.id}
                className="flex items-center justify-between rounded-xl border border-white/8 px-5 py-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="h-4 w-4 text-indigo-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-white">{org.name}</p>
                    <p className="text-xs text-zinc-500">/{org.slug}</p>
                  </div>
                </div>
                <span className="rounded-full border border-indigo-500/25 bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-300">
                  org
                </span>
              </div>
            ))}
          </div>
        ) : (
          <BeautifulEmptyState
            title="No organizations yet"
            hint="Create your first organization to start onboarding users."
          />
        )}
      </div>
    </div>
  );
}
