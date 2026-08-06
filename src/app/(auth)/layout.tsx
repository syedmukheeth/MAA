import Link from "next/link";
import { BrandMark } from "@/components/layout/BrandMark";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-ivory px-6 py-16">
      <Link href="/" className="group mb-10">
        <BrandMark size="md" />
      </Link>
      <div className="w-full max-w-md rounded-2xl border border-hairline bg-cream p-8 shadow-lift sm:p-10">
        {children}
      </div>
    </div>
  );
}
