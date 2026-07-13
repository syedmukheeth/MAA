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
import { REQUEST_STATUSES } from "@/lib/validations/custom-request";

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
    if (!next) return;
    setCurrent(next);
    startTransition(async () => {
      await updateRequestStatus(
        requestId,
        next as (typeof REQUEST_STATUSES)[number]
      );
    });
  }

  return (
    <Select value={current} onValueChange={onChange} disabled={isPending}>
      <SelectTrigger className="w-48">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {REQUEST_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {s.replace("_", " ")}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
