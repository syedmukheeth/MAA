import { redirect } from "next/navigation";
import { requireAuthPendingPassword } from "@/lib/auth/session";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";

/**
 * The one screen an account provisioned with a temporary password can reach.
 *
 * Guarded with requireAuthPendingPassword rather than requireAuth: requireAuth
 * redirects here whenever the flag is set, which on this route is a loop.
 */
export default async function ChangePasswordPage() {
  const session = await requireAuthPendingPassword();

  // Nothing forced them here, so there is a better home for a voluntary change.
  if (!session.pw) {
    redirect(session.role === "CUSTOMER" ? "/account" : "/admin/account");
  }

  return (
    <>
      <h1 className="font-heading text-2xl text-charcoal">Set Your Password</h1>
      <p className="mt-2 text-sm text-graphite/70 leading-relaxed">
        This account was set up with a temporary password. Choose your own to
        continue — nobody else will know it.
      </p>
      <ChangePasswordForm
        requireCurrent={false}
        submitLabel="Set Password"
        redirectTo={session.role === "CUSTOMER" ? "/products" : "/admin"}
      />
    </>
  );
}
