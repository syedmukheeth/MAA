"use client";

import { useState, useTransition } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  updatePrivacyRequestStatus,
  cancelScheduledErasure,
  executeErasureNow,
  retryCloudinaryPurge,
} from "@/actions/admin-privacy";

export type PrivacyRequestRow = {
  id: string;
  userId: string | null;
  type: "EXPORT" | "CORRECTION" | "ERASURE" | "GRIEVANCE";
  status:
    | "PENDING"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "REJECTED"
    | "ON_HOLD"
    | "CANCELLED";
  note: string | null;
  resolution: string | null;
  requestedAt: string;
  scheduledFor: string | null;
  completedAt: string | null;
  maskedEmail: string;
  alreadyErased: boolean;
  ageDays: number;
};

const OPEN_STATUSES = ["PENDING", "IN_PROGRESS", "ON_HOLD"];

export function PrivacyRequestTable({
  rows,
  isOwner,
  warnDays,
}: {
  rows: PrivacyRequestRow[];
  isOwner: boolean;
  warnDays: number;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-muted/30 p-6 text-sm text-muted-foreground">
        No privacy requests yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const open = OPEN_STATUSES.includes(row.status);
        const overdue = open && row.ageDays >= warnDays;
        return (
          <div
            key={row.id}
            className={`rounded-lg border bg-card p-4 ${
              overdue ? "border-destructive/50" : "border-border"
            }`}
          >
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="font-medium text-foreground">
                {TYPE_LABELS[row.type]}
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                {STATUS_LABELS[row.status]}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                {row.maskedEmail}
              </span>
              <span className="text-xs text-muted-foreground">
                {row.ageDays === 0 ? "today" : `${row.ageDays}d ago`}
              </span>
              {overdue && (
                <span className="flex items-center gap-1 text-xs font-medium text-destructive">
                  <AlertTriangle size={12} /> deadline approaching
                </span>
              )}
              {row.scheduledFor && row.status === "PENDING" && (
                <span className="text-xs text-muted-foreground">
                  erases {new Date(row.scheduledFor).toLocaleDateString("en-IN")}
                </span>
              )}
              <button
                type="button"
                onClick={() => setExpanded(expanded === row.id ? null : row.id)}
                className="ml-auto text-xs text-bronze underline"
              >
                {expanded === row.id ? "Close" : "Handle"}
              </button>
            </div>

            {row.note && (
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                {row.note}
              </p>
            )}
            {row.resolution && (
              <p className="mt-2 text-sm text-foreground">
                <strong>Response:</strong> {row.resolution}
              </p>
            )}

            {expanded === row.id && (
              <RequestActions row={row} isOwner={isOwner} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function RequestActions({
  row,
  isOwner,
}: {
  row: PrivacyRequestRow;
  isOwner: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [resolution, setResolution] = useState("");
  const [confirmation, setConfirmation] = useState("");

  function run(fn: () => Promise<{ error?: string; message?: string }>) {
    setFeedback(null);
    startTransition(async () => {
      const res = await fn();
      setFeedback(res.error ?? res.message ?? "Done.");
    });
  }

  const isErasure = row.type === "ERASURE";
  const stillPending = row.status === "PENDING" || row.status === "ON_HOLD";

  return (
    <div className="mt-4 space-y-4 border-t border-border pt-4">
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">
          Response to the customer (shown on their privacy page)
        </label>
        <Textarea
          rows={2}
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
          placeholder="What you did about it."
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() =>
              run(() =>
                updatePrivacyRequestStatus(row.id, "IN_PROGRESS", resolution)
              )
            }
          >
            Mark in progress
          </Button>
          {!isErasure && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() =>
                run(() =>
                  updatePrivacyRequestStatus(row.id, "COMPLETED", resolution)
                )
              }
            >
              Mark done
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() =>
              run(() => updatePrivacyRequestStatus(row.id, "REJECTED", resolution))
            }
          >
            Decline
          </Button>
        </div>
      </div>

      {isErasure && stillPending && (
        <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <p className="text-xs text-muted-foreground">
            The customer asked us to delete their data. It runs automatically
            after the cooling-off period. Cancel it only if they have asked you
            to.
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() =>
              run(() => cancelScheduledErasure(row.id, resolution))
            }
          >
            Cancel deletion and restore account
          </Button>

          {isOwner && (
            <div className="space-y-2 border-t border-destructive/20 pt-3">
              <p className="text-xs text-muted-foreground">
                Erasing now skips the cooling-off period. This cannot be undone.
                Type <span className="font-mono">ERASE NOW</span> to confirm.
              </p>
              <div className="flex gap-2">
                <Input
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  placeholder="ERASE NOW"
                  className="max-w-40"
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={pending || confirmation !== "ERASE NOW"}
                  className="bg-destructive text-white hover:bg-destructive/90"
                  onClick={() => run(() => executeErasureNow(row.id, confirmation))}
                >
                  Erase now
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {row.alreadyErased && row.userId && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => run(() => retryCloudinaryPurge(row.userId!))}
        >
          Retry deleting uploaded images
        </Button>
      )}

      {feedback && (
        <p className="text-sm text-muted-foreground" role="status">
          {feedback}
        </p>
      )}
    </div>
  );
}

const TYPE_LABELS: Record<PrivacyRequestRow["type"], string> = {
  EXPORT: "Data download",
  CORRECTION: "Correction",
  ERASURE: "Account deletion",
  GRIEVANCE: "Complaint",
};

const STATUS_LABELS: Record<PrivacyRequestRow["status"], string> = {
  PENDING: "New",
  IN_PROGRESS: "In progress",
  COMPLETED: "Done",
  REJECTED: "Declined",
  ON_HOLD: "On hold",
  CANCELLED: "Cancelled",
};
