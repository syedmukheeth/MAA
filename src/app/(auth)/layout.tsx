import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ivory px-6 py-16">
      <Link href="/" className="mb-10 flex items-center gap-3">
        <Image
          src="/brand/logo.jpeg"
          alt="MAA Furnitures"
          width={44}
          height={44}
          className="rounded-full"
        />
        <span className="font-heading text-lg text-charcoal">
          MAA Furnitures
        </span>
      </Link>
      <div className="w-full max-w-md rounded-2xl bg-cream p-8 sm:p-10">
        {children}
      </div>
    </div>
  );
}
