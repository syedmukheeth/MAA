import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { RequestTable } from "@/components/admin/RequestTable";

export default async function AdminRequestsPage() {
  await requireRole(["OWNER", "ADMIN", "MANAGER"]);

  const requests = await prisma.customFurnitureRequest.findMany({
    orderBy: { createdAt: "desc" },
  });

  const rows = requests.map((r) => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    budgetRange: r.budgetRange,
    status: r.status,
    createdAt: r.createdAt.toLocaleDateString("en-IN"),
  }));

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl text-foreground">
        Custom Furniture Requests
      </h1>
      <RequestTable requests={rows} />
    </div>
  );
}
