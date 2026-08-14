"use client";

import { useState, useTransition } from "react";
import { Check, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveError } from "@/actions/admin-monitoring";

export type ErrorRow = {
  fingerprint: string;
  name: string | null;
  message: string;
  route: string | null;
  stack: string | null;
  source: string;
  occurrences: number;
  firstSeen: string;
  lastSeen: string;
  hoursSinceLast: number;
  alerted: boolean;
};

const SOURCE_LABELS: Record<string, string> = {
  SERVER: "Server",
  CLIENT: "Browser",
  CRON: "Scheduled job",
};

export function ErrorEventTable({ errors }: { errors: ErrorRow[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  if (errors.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-muted/30 p-6 text-sm text-muted-foreground">
        No open errors. This is the expected state.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {errors.map((e) => {
        const isOpen = expanded === e.fingerprint;
        return (
          <div
            key={e.fingerprint}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="flex flex-wrap items-start gap-2">
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : e.fingerprint)}
                className="mt-0.5 text-muted-foreground"
                aria-label={isOpen ? "Collapse" : "Expand"}
              >
                {isOpen ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium text-foreground">
                    {e.name ?? "Error"}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {SOURCE_LABELS[e.source] ?? e.source}
                  </span>
                  {e.occurrences > 1 && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      &times;{e.occurrences}
                    </span>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {e.hoursSinceLast < 1
                      ? "just now"
                      : e.hoursSinceLast < 24
                        ? `${e.hoursSinceLast}h ago`
                        : new Date(e.lastSeen).toLocaleDateString("en-IN")}
                  </span>
                </div>

                <p className="mt-1 break-words font-mono text-xs text-muted-foreground">
                  {e.message}
                </p>

                {e.route && (
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {e.route}
                  </p>
                )}

                {isOpen && (
                  <div className="mt-3 space-y-3">
                    {e.stack && (
                      <pre className="overflow-x-auto rounded bg-muted p-3 text-xs text-muted-foreground">
                        {e.stack}
                      </pre>
                    )}
                    <p className="text-xs text-muted-foreground">
                      First seen{" "}
                      {new Date(e.firstSeen).toLocaleString("en-IN")} ·{" "}
                      {e.alerted ? "alert sent" : "no alert sent"} ·{" "}
                      <span className="font-mono">
                        {e.fingerprint.slice(0, 12)}
                      </span>
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => {
                        setFeedback(null);
                        startTransition(async () => {
                          const res = await resolveError(e.fingerprint);
                          setFeedback(
                            res.error ??
                              "Marked resolved. It will reopen automatically if it happens again."
                          );
                        });
                      }}
                      className="rounded-full"
                    >
                      <Check size={14} className="mr-1" />
                      Mark resolved
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {feedback && (
        <p role="status" className="text-sm text-muted-foreground">
          {feedback}
        </p>
      )}
    </div>
  );
}
