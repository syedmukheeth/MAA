"use client";

import { useState } from "react";
import { AlertTriangle, Bell, BellOff } from "lucide-react";

export type SecurityEventRow = {
  id: string;
  type: string;
  severity: "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  summary: string;
  /** Short prefix of the keyed IP hash. Never an address. */
  source: string | null;
  userId: string | null;
  alerted: boolean;
  at: string;
  ageHours: number;
};

const SEVERITY_STYLES: Record<SecurityEventRow["severity"], string> = {
  CRITICAL: "bg-destructive/15 text-destructive border-destructive/40",
  HIGH: "bg-destructive/10 text-destructive border-destructive/30",
  MEDIUM: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  LOW: "bg-muted text-muted-foreground border-border",
  INFO: "bg-muted text-muted-foreground border-border",
};

const TYPE_LABELS: Record<string, string> = {
  LOGIN_FAILED: "Failed sign-in",
  CREDENTIAL_STUFFING_SUSPECTED: "Repeated attempts on one account",
  PASSWORD_SPRAYING_SUSPECTED: "One source, many accounts",
  LOGIN_SUCCESS_AFTER_FAILURES: "Sign-in after repeated failures",
  PRIVILEGE_ESCALATION: "Role raised",
  STAFF_ACCESS_CHANGED: "Staff access changed",
  UNAUTHORISED_ACCESS_ATTEMPT: "Blocked access attempt",
  CRON_AUTH_FAILED: "Erasure job called without a valid token",
  BULK_DATA_EXPORT: "Repeated data export",
  ERASURE_EXECUTED: "Account data erased",
};

/**
 * Read-only timeline. There is deliberately no delete or edit control: a
 * security log the watched parties can prune is not a control, and the
 * retention sweep is the only thing that removes rows.
 */
export function SecurityEventTable({
  events,
}: {
  events: SecurityEventRow[];
}) {
  // Noise defaults off. LOGIN_FAILED alone is the highest-volume event by far,
  // and a dashboard that opens on a wall of routine mistyped passwords is one
  // nobody reads twice.
  const [showInfo, setShowInfo] = useState(false);

  const visible = showInfo
    ? events
    : events.filter((e) => e.severity !== "INFO");

  const hiddenCount = events.length - visible.length;

  if (events.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-muted/30 p-6 text-sm text-muted-foreground">
        No security events recorded yet. This is the expected state — events
        appear when something anomalous happens.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setShowInfo((v) => !v)}
          className="text-xs text-bronze underline"
        >
          {showInfo
            ? "Hide routine events"
            : `Show ${hiddenCount} routine event(s)`}
        </button>
      )}

      {visible.length === 0 ? (
        <p className="rounded-lg border border-border bg-muted/30 p-6 text-sm text-muted-foreground">
          Nothing but routine events in this window.
        </p>
      ) : (
        <ul className="space-y-2">
          {visible.map((e) => (
            <li
              key={e.id}
              className={`rounded-lg border p-4 ${
                e.severity === "CRITICAL" || e.severity === "HIGH"
                  ? "border-destructive/40 bg-destructive/5"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs font-medium ${SEVERITY_STYLES[e.severity]}`}
                >
                  {e.severity}
                </span>
                <span className="font-medium text-foreground">
                  {TYPE_LABELS[e.type] ?? e.type}
                </span>
                {(e.severity === "CRITICAL" || e.severity === "HIGH") && (
                  <AlertTriangle size={14} className="text-destructive" />
                )}
                <span className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                  {e.alerted ? (
                    <span
                      className="flex items-center gap-1"
                      title="An alert email was sent"
                    >
                      <Bell size={12} /> alerted
                    </span>
                  ) : (
                    e.severity === "HIGH" || e.severity === "CRITICAL" ? (
                      <span
                        className="flex items-center gap-1"
                        title="No email sent — an alert for this type had already gone out within the throttle window"
                      >
                        <BellOff size={12} /> throttled
                      </span>
                    ) : null
                  )}
                  {e.ageHours < 1
                    ? "just now"
                    : e.ageHours < 24
                      ? `${e.ageHours}h ago`
                      : new Date(e.at).toLocaleDateString("en-IN")}
                </span>
              </div>

              <p className="mt-2 text-sm text-muted-foreground">{e.summary}</p>

              <div className="mt-2 flex flex-wrap gap-4 font-mono text-xs text-muted-foreground">
                {e.source && <span>source {e.source}</span>}
                {e.userId && <span>account {e.userId.slice(0, 10)}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
