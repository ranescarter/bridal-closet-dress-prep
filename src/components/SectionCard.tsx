"use client";

import { useState, type ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: ReactNode;
  tone?: "strong" | "soft";
  /** When true, header toggles open/closed (social-dashboard style). */
  collapsible?: boolean;
  defaultOpen?: boolean;
  headerRight?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * Blush section bar + white body — matches Social media responses headers.
 */
export function SectionCard({
  title,
  subtitle,
  tone = "strong",
  collapsible = false,
  defaultOpen = true,
  headerRight,
  children,
  className = "",
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const headerClass =
    tone === "strong" ? "bg-[var(--blush)]" : "bg-[var(--blush-soft)]";
  const showBody = !collapsible || open;

  return (
    <section
      className={`overflow-hidden rounded-[1.25rem] bg-white shadow-sm ring-1 ring-black/5 ${className}`}
    >
      <div
        className={`flex flex-wrap items-center justify-between gap-4 px-5 py-4 ${headerClass}`}
      >
        {collapsible ? (
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            className="flex min-w-0 flex-1 items-center justify-between gap-4 text-left"
            aria-expanded={open}
          >
            <div className="min-w-0">
              <h2 className="font-[family-name:var(--font-display)] text-3xl font-normal text-[var(--ink)]">
                {title}
              </h2>
              {subtitle ? (
                <div className="mt-1 text-sm text-[var(--muted)]">{subtitle}</div>
              ) : null}
            </div>
            <span
              className="shrink-0 text-sm font-bold text-[var(--muted)]"
              aria-hidden
            >
              {open ? "−" : "+"}
            </span>
          </button>
        ) : (
          <div className="min-w-0 flex-1">
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-normal text-[var(--ink)]">
              {title}
            </h2>
            {subtitle ? (
              <div className="mt-1 text-sm text-[var(--muted)]">{subtitle}</div>
            ) : null}
          </div>
        )}
        {headerRight ? (
          <div className="flex flex-wrap items-center gap-3">{headerRight}</div>
        ) : null}
      </div>

      {showBody ? (
        <div className="space-y-5 border-t-2 border-[var(--blush)] px-5 pb-5 pt-4">
          {children}
        </div>
      ) : null}
    </section>
  );
}
