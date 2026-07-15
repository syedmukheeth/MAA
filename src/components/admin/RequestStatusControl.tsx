"use client";

import { useState, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateRequestStatus } from "@/actions/custom-requests";
import {
  REQUEST_STATUSES,
  REQUEST_STATUS_FLOW,
  type RequestStatusValue,
} from "@/lib/validations/custom-request";

export function RequestStatusControl({
  requestId,
  status,
}: {
  requestId: string;
  status: string;
}) {
  const [current, setCurrent] = useState(status);
  const [isPending, startTransition] = useTransition();

  function onChange(next: string | null) {
    if (!next || next === current) return;
    const prev = current;
    setCurrent(next);
    startTransition(async () => {
      const res = await updateRequestStatus(
        requestId,
        next as (typeof REQUEST_STATUSES)[number]
      );
      if (res?.error) setCurrent(prev);
    });
  }

  const allowedNext =
    REQUEST_STATUS_FLOW[current as RequestStatusValue] ?? [];

  return (
    <Select value={current} onValueChange={onChange} disabled={isPending}>
      <SelectTrigger className="w-48">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {REQUEST_STATUSES.map((s) => (
          <SelectItem
            key={s}
            value={s}
            disabled={s !== current && !allowedNext.includes(s)}
          >
            {s.replace("_", " ")}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
