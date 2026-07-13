import { requireRole } from "@/lib/auth/session";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function NewProductPage() {
  await requireRole(["OWNER", "ADMIN", "MANAGER"]);

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl text-foreground">
        New Product
      </h1>
      <ProductForm />
    </div>
  );
}
