import { z } from "zod";

export const customRequestSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(6, "Phone is required"),
  inspirationUrl: z.string().optional(),
  imageUrl: z.string().optional(),
  dimensions: z.string().optional(),
  wood: z.string().optional(),
  finish: z.string().optional(),
  budgetRange: z.string().optional(),
  description: z.string().optional(),
});

export type CustomRequestInput = z.infer<typeof customRequestSchema>;

export const REQUEST_STATUSES = [
  "NEW",
  "IN_REVIEW",
  "QUOTED",
  "CONVERTED",
  "CLOSED",
] as const;

export type RequestStatusValue = (typeof REQUEST_STATUSES)[number];

export const REQUEST_STATUS_FLOW: Record<RequestStatusValue, RequestStatusValue[]> = {
  NEW: ["IN_REVIEW", "CLOSED"],
  IN_REVIEW: ["QUOTED", "CLOSED"],
  QUOTED: ["CONVERTED", "CLOSED"],
  CONVERTED: [],
  CLOSED: ["IN_REVIEW"],
};

/** Manager-friendly names for each status. */
export const REQUEST_STATUS_LABELS: Record<RequestStatusValue, string> = {
  NEW: "New",
  IN_REVIEW: "In Process",
  QUOTED: "Quoted",
  CONVERTED: "Converted",
  CLOSED: "Rejected / Cancelled",
};

/** Button label for moving a request INTO the given status. */
export const REQUEST_ACTION_LABELS: Record<RequestStatusValue, string> = {
  NEW: "Mark New",
  IN_REVIEW: "Accept",
  QUOTED: "Send Quote",
  CONVERTED: "Mark Converted",
  CLOSED: "Reject / Cancel",
};
