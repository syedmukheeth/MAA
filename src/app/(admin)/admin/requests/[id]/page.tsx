import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { RequestStatusControl } from "@/components/admin/RequestStatusControl";
import { BackLink } from "@/components/admin/BackLink";

export default async function AdminRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["OWNER", "ADMIN", "MANAGER"]);
  const { id } = await params;

  const request = await prisma.customFurnitureRequest.findUnique({
    where: { id },
  });
  if (!request) notFound();

  const fields: [string, string | null][] = [
    ["Name", request.name],
    ["Phone", request.phone],
    ["Inspiration URL", request.inspirationUrl],
    ["Dimensions", request.dimensions],
    ["Wood", request.wood],
    ["Finish", request.finish],
    ["Budget", request.budgetRange],
  ];

  // Admin-defined custom feature answers stored as a JSON object.
  let customOptions: [string, string][] = [];
  if (request.customOptions) {
    try {
      const parsed = JSON.parse(request.customOptions) as Record<string, unknown>;
      customOptions = Object.entries(parsed)
        .filter(([, v]) => typeof v === "string" && v.length > 0)
        .map(([k, v]) => [k, v as string]);
    } catch {
      // Malformed JSON — skip
    }
  }
  for (const [label, value] of customOptions) {
    fields.push([label, value]);
  }

  return (
    <div className="max-w-2xl">
      <BackLink href="/admin/requests" label="Back to Custom Requests" />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl text-foreground">
          {request.name}&apos;s Request
        </h1>
        <RequestStatusControl requestId={request.id} status={request.status} />
      </div>

      <div className="rounded-xl border border-border p-6">
        <div className="space-y-3">
          {fields.map(([label, value]) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{label}</span>
              <span className="text-foreground">{value ?? "-"}</span>
            </div>
          ))}
        </div>
        {request.description && (
          <div className="mt-4 border-t border-border pt-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Description
            </p>
            <p className="mt-2 text-sm text-foreground">
              {request.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
