"use client";

import { useMemo, useState } from "react";

const testimonials = [
  {
    quote: "This made coordination effortless. I can see exactly where work is stuck.",
    name: "Ritika, Operations Lead",
  },
  {
    quote: "The handoff clarity is excellent. QA and developers now move faster together.",
    name: "Sanjay, QA Manager",
  },
  {
    quote: "The dashboard feels premium and gives leadership confidence instantly.",
    name: "Ananya, Program Supervisor",
  },
];

export default function AdminTestimonialsPage() {
  const [index, setIndex] = useState(0);
  const current = useMemo(() => testimonials[index], [index]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-violet-300">Customer Voice</p>
        <h2 className="mt-1 text-2xl font-bold text-white">Testimonial carousel</h2>
      </div>

      <div className="rounded-2xl border border-white/8 bg-linear-to-br from-violet-500/10 to-indigo-500/10 p-8">
        <p className="text-lg italic text-white">“{current.quote}”</p>
        <p className="mt-4 text-sm font-semibold text-violet-200">{current.name}</p>

        <div className="mt-6 flex gap-2">
          {testimonials.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              className={`h-2.5 w-7 rounded-full ${i === index ? "bg-violet-400" : "bg-white/20"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

