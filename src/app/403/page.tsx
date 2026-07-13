import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ivory px-6 text-center">
      <p className="text-xs uppercase tracking-[0.35em] text-bronze">403</p>
      <h1 className="mt-4 font-heading text-3xl text-charcoal">
        You don&apos;t have access to this page
      </h1>
      <p className="mt-3 max-w-sm text-sm text-graphite/70">
        Your account doesn&apos;t have permission to view this. If you think
        this is a mistake, contact an admin.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-charcoal px-6 py-2.5 text-sm text-ivory hover:bg-charcoal/90"
      >
        Back to homepage
      </Link>
    </div>
  );
}
