import type { ReactNode } from "react";

/**
 * Shared shell for /privacy, /terms and /grievance.
 *
 * A narrow measure and generous leading are not decoration here: DPDP Rule 3
 * requires the notice to be understandable, and a wall of full-width small text
 * is the standard way of complying in form while failing in substance.
 */
export function LegalPage({
  title,
  subtitle,
  version,
  effectiveDate,
  children,
}: {
  title: string;
  subtitle?: string;
  version?: string;
  effectiveDate?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 lg:py-16">
      <h1 className="font-heading text-3xl text-charcoal sm:text-4xl">{title}</h1>
      {subtitle && (
        <p className="mt-3 text-base leading-relaxed text-graphite/80">{subtitle}</p>
      )}
      {(version || effectiveDate) && (
        <p className="mt-4 text-xs text-graphite/50">
          {effectiveDate && <>Effective {effectiveDate}</>}
          {version && effectiveDate && " · "}
          {version && <>Version {version}</>}
        </p>
      )}
      <div className="mt-10 space-y-10">{children}</div>
    </div>
  );
}

export function Section({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-heading text-xl text-charcoal">{heading}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-graphite/80">
        {children}
      </div>
    </section>
  );
}

/**
 * Itemised table for the data inventory. DPDP Rules 2025 require the notice to
 * be itemised rather than a prose paragraph a reader has to unpick, so the
 * inventory is rendered as an actual table.
 */
export function DataTable({
  rows,
}: {
  rows: { what: string; why: string; basis: string; kept: string }[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-graphite/60">
            <th className="py-2 pr-4 font-medium">What we collect</th>
            <th className="py-2 pr-4 font-medium">Why</th>
            <th className="py-2 pr-4 font-medium">Our legal basis</th>
            <th className="py-2 font-medium">How long we keep it</th>
          </tr>
        </thead>
        <tbody className="text-graphite/80">
          {rows.map((row) => (
            <tr key={row.what} className="border-b border-border/50 align-top">
              <td className="py-3 pr-4 font-medium text-charcoal">{row.what}</td>
              <td className="py-3 pr-4">{row.why}</td>
              <td className="py-3 pr-4">{row.basis}</td>
              <td className="py-3">{row.kept}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
