import { requireRole } from "@/lib/auth/session";
import { ProductForm } from "@/components/admin/ProductForm";
import { BackLink } from "@/components/admin/BackLink";

export default async function NewProductPage() {
  await requireRole(["OWNER", "ADMIN", "MANAGER"]);

  return (
    <div>
      <BackLink href="/admin/products" label="Back to Products" />
      <h1 className="mb-6 font-heading text-2xl text-foreground">
        New Product
      </h1>
      <ProductForm />
    </div>
  );
}
