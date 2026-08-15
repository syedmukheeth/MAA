import Link from "next/link";
import Image from "next/image";

/**
 * Rendered per request, never prerendered.
 *
 * src/proxy.ts mints a CSP nonce per request and threads it through on the
 * request headers so Next can stamp it onto every script tag it emits. A page
 * prerendered at build time has no request and therefore no nonce, but the
 * header still arrives with one — and `strict-dynamic` then blocks every chunk
 * on the page. These four routes (login, register, forgot-password,
 * reset-password) were static, so in production they shipped as bare markup
 * with no working JavaScript: no form submission, no validation, nothing.
 *
 * They are login forms with nothing cacheable about them, so making them
 * dynamic costs nothing.
 */
export const dynamic = "force-dynamic";

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
          alt="MAA FURNITURE"
          width={44}
          height={44}
          className="rounded-full"
        />
        <span className="font-heading text-lg text-charcoal">
          MAA FURNITURE
        </span>
      </Link>
      <div className="w-full max-w-md rounded-2xl bg-cream p-8 sm:p-10">
        {children}
      </div>
    </div>
  );
}
