"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { AppointmentTimePicker } from "@/components/AppointmentTimePicker";
import { StaffCreateForm } from "@/components/StaffCreateForm";
import { StaffLoginForm } from "@/components/StaffLoginForm";
import {
  appointmentSortValue,
  appointmentToEditFields,
  appointmentToIso,
  formatAppointmentDate,
  formatAppointmentTime,
  formatLastUpdated,
  isPastAppointment,
  to24HourTime,
  type Meridiem,
} from "@/lib/appointments";
import type { DressPrepSessionSummary } from "@/lib/types";
import { brideSessionUrl, copyText, guestSessionUrl } from "@/lib/urls";

type CopiedKey = string | null;
type SortKey = "appointment" | "name";
type SortDir = "asc" | "desc";
type TableSection = "upcoming" | "past";

type SortState = {
  key: SortKey;
  dir: SortDir;
};

/** Titles are often "Dress Name by Vendor" or "… by Vendor - Sample Sale". */
function parseDressNameAndVendor(title: string): { name: string; vendor: string } {
  const match = title.match(/^(.*?)\s+by\s+(.+)$/i);
  if (!match) {
    return { name: title.trim() || "—", vendor: "—" };
  }
  const name = match[1].trim() || "—";
  const vendor = match[2].replace(/\s+-\s+.+$/, "").trim() || "—";
  return { name, vendor };
}

function sortSessions(
  rows: DressPrepSessionSummary[],
  sortKey: SortKey,
  sortDir: SortDir,
) {
  const dir = sortDir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    if (sortKey === "name") {
      const left = a.client_name.toLowerCase();
      const right = b.client_name.toLowerCase();
      if (left < right) return -1 * dir;
      if (left > right) return 1 * dir;
      return appointmentSortValue(b.appointment_at) - appointmentSortValue(a.appointment_at);
    }

    // Keep date TBD at the bottom so today's appointments stay on top.
    if (!a.appointment_at && !b.appointment_at) {
      return a.client_name.localeCompare(b.client_name);
    }
    if (!a.appointment_at) return 1;
    if (!b.appointment_at) return -1;

    const aTime = appointmentSortValue(a.appointment_at);
    const bTime = appointmentSortValue(b.appointment_at);
    if (aTime !== bTime) return (aTime - bTime) * dir;
    return a.client_name.localeCompare(b.client_name);
  });
}

export function StaffDashboard() {
  const [authStatus, setAuthStatus] = useState<"checking" | "login" | "authed">(
    "checking",
  );
  const [sessions, setSessions] = useState<DressPrepSessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [copied, setCopied] = useState<CopiedKey>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [upcomingSort, setUpcomingSort] = useState<SortState>({
    key: "appointment",
    dir: "asc",
  });
  const [pastSort, setPastSort] = useState<SortState>({
    key: "appointment",
    dir: "desc",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editHour12, setEditHour12] = useState("10");
  const [editMinute, setEditMinute] = useState("00");
  const [editMeridiem, setEditMeridiem] = useState<Meridiem>("AM");
  const [editHasTime, setEditHasTime] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

  function toggleExpanded(sessionId: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) next.delete(sessionId);
      else next.add(sessionId);
      return next;
    });
  }

  const loadSessions = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/sessions");
    if (res.status === 401) {
      setAuthStatus("login");
      return;
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not load sessions");
    setSessions(data.sessions || []);
  }, []);

  async function signOut() {
    await fetch("/api/staff/logout", { method: "POST" });
    setAuthStatus("login");
    setSessions([]);
    setShowCreate(false);
    setError(null);
  }

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      setLoading(true);
      try {
        const sessionRes = await fetch("/api/staff/session");
        const sessionData = await sessionRes.json();
        if (cancelled) return;

        if (!sessionData.authenticated) {
          setAuthStatus("login");
          return;
        }

        setAuthStatus("authed");
        await loadSessions();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void boot();
    return () => {
      cancelled = true;
    };
  }, [loadSessions]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? sessions.filter((s) => s.client_name.toLowerCase().includes(q))
      : sessions;
  }, [search, sessions]);

  const upcoming = useMemo(() => {
    const rows = filtered.filter((s) => !isPastAppointment(s.appointment_at));
    return sortSessions(rows, upcomingSort.key, upcomingSort.dir);
  }, [filtered, upcomingSort]);

  const past = useMemo(() => {
    const rows = filtered.filter((s) => isPastAppointment(s.appointment_at));
    return sortSessions(rows, pastSort.key, pastSort.dir);
  }, [filtered, pastSort]);

  function toggleSort(section: TableSection, column: SortKey) {
    const setSort = section === "upcoming" ? setUpcomingSort : setPastSort;
    setSort((current) => {
      if (current.key === column) {
        return { key: column, dir: current.dir === "asc" ? "desc" : "asc" };
      }
      return {
        key: column,
        dir:
          column === "appointment"
            ? section === "upcoming"
              ? "asc"
              : "desc"
            : "asc",
      };
    });
  }

  async function copyUrl(key: string, url: string) {
    await copyText(url);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 2000);
  }

  function startEdit(session: DressPrepSessionSummary) {
    const fields = appointmentToEditFields(session.appointment_at);
    setEditingId(session.id);
    setEditDate(fields.date);
    setEditHour12(fields.hour12);
    setEditMinute(fields.minute);
    setEditMeridiem(fields.meridiem);
    setEditHasTime(fields.hasTime);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(sessionId: string) {
    setSavingId(sessionId);
    setError(null);
    try {
      const appointmentAt = appointmentToIso(
        editDate,
        editHasTime ? to24HourTime(editHour12, editMinute, editMeridiem) : null,
      );

      const res = await fetch("/api/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sessionId, appointmentAt }),
      });
      if (res.status === 401) {
        setAuthStatus("login");
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update appointment");

      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                appointment_at: data.session.appointment_at,
                updated_at: data.session.updated_at,
                last_updated_at: data.session.updated_at,
              }
            : s,
        ),
      );
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update");
    } finally {
      setSavingId(null);
    }
  }

  async function removeSession(session: DressPrepSessionSummary) {
    const ok = window.confirm(
      `Remove dress prep for ${session.client_name}? This deletes their favorites too.`,
    );
    if (!ok) return;

    setRemovingId(session.id);
    setError(null);
    try {
      const res = await fetch("/api/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: session.id }),
      });
      if (res.status === 401) {
        setAuthStatus("login");
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not remove");
      setSessions((prev) => prev.filter((s) => s.id !== session.id));
      if (editingId === session.id) setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove");
    } finally {
      setRemovingId(null);
    }
  }

  function handleCreated() {
    setShowCreate(false);
    void loadSessions().catch((err) => {
      setError(err instanceof Error ? err.message : "Could not refresh list");
    });
  }

  function setEditTimePart(
    next: Partial<{ hour12: string; minute: string; meridiem: Meridiem }>,
  ) {
    if (next.hour12 !== undefined) setEditHour12(next.hour12);
    if (next.minute !== undefined) setEditMinute(next.minute);
    if (next.meridiem !== undefined) setEditMeridiem(next.meridiem);
    setEditHasTime(true);
  }

  function SortHeader({
    label,
    column,
    section,
    sort,
  }: {
    label: string;
    column: SortKey;
    section: TableSection;
    sort: SortState;
  }) {
    const active = sort.key === column;
    const arrow = active ? (sort.dir === "asc" ? " ↑" : " ↓") : "";
    return (
      <button
        type="button"
        onClick={() => toggleSort(section, column)}
        className={`inline-flex items-center font-medium ${
          active ? "text-[var(--ink)]" : "text-[var(--muted)]"
        }`}
      >
        {label}
        {arrow}
      </button>
    );
  }

  function SessionTable({
    rows,
    emptyLabel,
    section,
    sort,
  }: {
    rows: DressPrepSessionSummary[];
    emptyLabel: string;
    section: TableSection;
    sort: SortState;
  }) {
    if (!rows.length) {
      return (
        <p className="rounded-xl bg-white px-4 py-6 text-sm text-[var(--muted)] ring-1 ring-black/5">
          {emptyLabel}
        </p>
      );
    }

    return (
      <div className="overflow-x-auto rounded-[1.25rem] bg-white shadow-sm ring-1 ring-black/5">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--blush)] bg-[var(--blush-soft)] text-sm font-medium text-[var(--ink)]">
            <tr>
              <th className="px-4 py-3">
                <SortHeader
                  label="Bride’s name"
                  column="name"
                  section={section}
                  sort={sort}
                />
              </th>
              <th className="px-4 py-3">
                <SortHeader
                  label="Appointment"
                  column="appointment"
                  section={section}
                  sort={sort}
                />
              </th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3 text-center">Saved</th>
              <th className="px-4 py-3">Last updated</th>
              <th className="px-4 py-3">Bride’s link</th>
              <th className="px-4 py-3">Read only link</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((session) => {
              const brideUrl = brideSessionUrl(session.client_token);
              const familyUrl = guestSessionUrl(session.staff_token);
              const brideKey = `${session.id}-bride`;
              const familyKey = `${session.id}-family`;
              const editing = editingId === session.id;
              const expanded = expandedIds.has(session.id);
              const favorites = session.favorites ?? [];

              return (
                <Fragment key={session.id}>
                  <tr className="border-b border-black/5">
                    <td className="px-4 py-3 font-medium text-[var(--ink)]">
                      <button
                        type="button"
                        onClick={() => toggleExpanded(session.id)}
                        aria-expanded={expanded}
                        className="inline-flex items-center gap-2 text-left"
                      >
                        <span
                          className={`inline-block text-[var(--muted)] transition-transform ${
                            expanded ? "rotate-90" : ""
                          }`}
                          aria-hidden
                        >
                          ▸
                        </span>
                        {session.client_name}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {editing ? (
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="rounded-lg border border-black/10 px-2 py-1 text-sm outline-none focus:border-[var(--blush)] focus:ring-2 focus:ring-[var(--blush)]"
                        />
                      ) : (
                        formatAppointmentDate(session.appointment_at)
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {editing ? (
                        <AppointmentTimePicker
                          variant="inline"
                          hour12={editHour12}
                          minute={editMinute}
                          meridiem={editMeridiem}
                          hasTime={editHasTime}
                          onChange={setEditTimePart}
                        />
                      ) : (
                        formatAppointmentTime(session.appointment_at)
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-[var(--ink)]">
                      <button
                        type="button"
                        onClick={() => toggleExpanded(session.id)}
                        className="underline decoration-black/20 underline-offset-2"
                        aria-expanded={expanded}
                      >
                        {session.favorite_count}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {formatLastUpdated(session.last_updated_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void copyUrl(brideKey, brideUrl)}
                          className="rounded-full bg-[var(--blush)] px-3 py-1.5 text-xs font-medium text-[var(--ink)]"
                        >
                          {copied === brideKey ? "Copied" : "Copy"}
                        </button>
                        <a
                          href={brideUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full bg-[var(--blush-soft)] px-3 py-1.5 text-xs font-medium text-[var(--ink)] ring-1 ring-black/10"
                        >
                          Open
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void copyUrl(familyKey, familyUrl)}
                          className="rounded-full bg-[var(--blush)] px-3 py-1.5 text-xs font-medium text-[var(--ink)]"
                        >
                          {copied === familyKey ? "Copied" : "Copy"}
                        </button>
                        <a
                          href={familyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full bg-[var(--blush-soft)] px-3 py-1.5 text-xs font-medium text-[var(--ink)] ring-1 ring-black/10"
                        >
                          Open
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-3">
                        {editing ? (
                          <>
                            <button
                              type="button"
                              disabled={savingId === session.id}
                              onClick={() => void saveEdit(session.id)}
                              className="text-xs font-medium text-[var(--ink)] underline disabled:opacity-50"
                            >
                              {savingId === session.id ? "Saving…" : "Save"}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="text-xs text-[var(--muted)] underline"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEdit(session)}
                              className="text-xs text-[var(--ink)] underline"
                            >
                              Edit Appointment
                            </button>
                            <button
                              type="button"
                              disabled={removingId === session.id}
                              onClick={() => void removeSession(session)}
                              className="text-xs text-red-600 underline disabled:opacity-50"
                            >
                              {removingId === session.id ? "Removing…" : "Remove"}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expanded ? (
                    <tr className="border-b border-black/5 bg-[var(--blush-soft)]/60 last:border-b-0">
                      <td colSpan={8} className="px-4 py-3">
                        <div className="mb-3 text-sm">
                          <span className="text-[var(--muted)]">Pinterest: </span>
                          {session.pinterest_url ? (
                            <a
                              href={session.pinterest_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-[var(--ink)] underline"
                            >
                              View bride&apos;s Pinterest board
                              {session.pinterest_updated_at
                                ? ` · updated ${formatLastUpdated(session.pinterest_updated_at)}`
                                : ""}
                            </a>
                          ) : (
                            <span className="text-[var(--muted)]">Not added</span>
                          )}
                        </div>
                        {favorites.length === 0 ? (
                          <p className="text-sm text-[var(--muted)]">
                            No favorites yet.
                          </p>
                        ) : (
                          <table className="w-full max-w-xl border-collapse overflow-hidden rounded-lg text-left text-sm ring-1 ring-[var(--blush)]">
                            <thead>
                              <tr className="bg-[var(--blush)] text-[var(--ink)]">
                                <th className="border-b border-r border-[var(--blush)] px-3 py-2 font-medium">
                                  Dress
                                </th>
                                <th className="border-b border-[var(--blush)] px-3 py-2 font-medium">
                                  Vendor
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {favorites.map((favorite, index) => {
                                const { name, vendor } = parseDressNameAndVendor(
                                  favorite.title,
                                );
                                return (
                                  <tr
                                    key={favorite.id}
                                    className={
                                      index % 2 === 0
                                        ? "bg-white"
                                        : "bg-[var(--blush-soft)]"
                                    }
                                  >
                                    <td className="border-b border-r border-[var(--blush)] px-3 py-2 text-[var(--ink)]">
                                      {name}
                                    </td>
                                    <td className="border-b border-[var(--blush)] px-3 py-2 text-[var(--ink)]">
                                      {vendor}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  if (authStatus === "checking") {
    return <p className="text-[var(--muted)]">Loading…</p>;
  }

  if (authStatus === "login") {
    return (
      <StaffLoginForm
        onSuccess={() => {
          setAuthStatus("authed");
          setLoading(true);
          void loadSessions()
            .catch((err) => {
              setError(err instanceof Error ? err.message : "Failed to load");
            })
            .finally(() => setLoading(false));
        }}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-normal text-[var(--ink)]">
            Appointment prep dashboard
          </h1>
          <p className="text-[var(--muted)]">
            Create links, copy bride or read-only URLs, and see how many favorites were saved.
          </p>
        </div>
        {!showCreate ? (
          <div className="flex items-center gap-3">
            <a
              href="/staff/social-media-responses"
              className="rounded-full bg-white px-4 py-2.5 text-sm font-medium text-[var(--ink)] ring-1 ring-black/10 transition hover:bg-black/[0.03]"
            >
              Social media
            </a>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="rounded-full bg-[var(--blush)] px-5 py-2.5 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--blush)]/80"
            >
              + Create link
            </button>
            <button
              type="button"
              onClick={() => void signOut()}
              className="text-sm text-[var(--muted)] underline"
            >
              Sign out
            </button>
          </div>
        ) : null}
      </header>

      <section className="overflow-hidden rounded-2xl ring-1 ring-black/5">
        <button
          type="button"
          onClick={() => setShowHowItWorks((open) => !open)}
          className="flex w-full items-center justify-between gap-3 bg-[var(--blush)] px-4 py-3 text-left sm:px-5"
          aria-expanded={showHowItWorks}
        >
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)] sm:text-2xl">
            How these pages work
          </h2>
          <span className="text-lg text-[var(--ink)]" aria-hidden>
            {showHowItWorks ? "−" : "+"}
          </span>
        </button>
        {showHowItWorks ? (
          <div className="space-y-3 bg-white/80 px-4 py-4 sm:px-5">
            <dl className="space-y-2 text-sm leading-snug text-[var(--muted)]">
              <div>
                <dt className="inline font-bold text-[var(--ink)]">Create link</dt>
                <dd className="m-0 inline">
                  {" "}
                  - Creates a prep page for a bride before her appointment. Her
                  name and appointment date and time appear on the pages others
                  can open.
                </dd>
              </div>
              <div>
                <dt className="inline font-bold text-[var(--ink)]">
                  Bride&apos;s link
                </dt>
                <dd className="m-0 inline">
                  {" "}
                  - An editable page where the bride browses dresses available
                  in the store and saves favorites. Saved dresses appear at the
                  bottom of that page.
                </dd>
              </div>
              <div>
                <dt className="inline font-bold text-[var(--ink)]">
                  Read only link
                </dt>
                <dd className="m-0 inline">
                  {" "}
                  - A shareable page that shows only what the bride has saved.
                  Others can view favorites but cannot change them.
                </dd>
              </div>
              <div>
                <dt className="inline font-bold text-[var(--ink)]">
                  Edit Appointment
                </dt>
                <dd className="m-0 inline">
                  {" "}
                  - Updates the appointment date and time if needed. This is
                  only a reference on the linked pages for the bride and others.
                </dd>
              </div>
              <div>
                <dt className="inline font-bold text-[var(--ink)]">Remove</dt>
                <dd className="m-0 inline">
                  {" "}
                  - Removes the row from these tables. Use after an appointment;
                  linked pages for that bride will no longer work.
                </dd>
              </div>
            </dl>
            <div className="border-t border-black/5 pt-3">
              <h3 className="text-sm font-bold text-[var(--ink)]">
                Where the dresses come from
              </h3>
              <p className="mt-0.5 text-sm leading-snug text-[var(--muted)]">
                Products on the bride&apos;s page come from Shopify: the{" "}
                <span className="font-medium text-[var(--ink)]">
                  Gowns In Store
                </span>{" "}
                collection, with status{" "}
                <span className="font-medium text-[var(--ink)]">Active</span>.
                Filters on that page use product{" "}
                <span className="font-medium text-[var(--ink)]">tags</span>.
                Category and Type are not used here.
              </p>
            </div>
          </div>
        ) : null}
      </section>

      <div className="space-y-8 border-t border-[var(--blush)] pt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="w-full max-w-md">
            <span className="sr-only">Search by bride name</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bride’s name…"
              className="w-full rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--blush)] focus:ring-2 focus:ring-[var(--blush)]"
            />
          </label>
          <p className="text-sm text-[var(--muted)]">{filtered.length} links</p>
        </div>

        {showCreate ? (
          <StaffCreateForm
            onCreated={handleCreated}
            onCancel={() => setShowCreate(false)}
            onUnauthorized={() => setAuthStatus("login")}
          />
        ) : null}

        {error ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : null}

        {loading ? (
          <p className="text-[var(--muted)]">Loading sessions…</p>
        ) : (
          <div className="space-y-8">
            <section className="space-y-3">
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                Upcoming
              </h2>
              <SessionTable
                rows={upcoming}
                emptyLabel="No upcoming dress prep links."
                section="upcoming"
                sort={upcomingSort}
              />
            </section>

            <section className="space-y-3">
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                Past
              </h2>
              <SessionTable
                rows={past}
                emptyLabel="No past appointments yet."
                section="past"
                sort={pastSort}
              />
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
