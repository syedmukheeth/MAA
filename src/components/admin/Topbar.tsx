import { LogOut } from "lucide-react";
import { logoutAction } from "@/actions/auth";

export function Topbar({
  email,
  role,
}: {
  email: string;
  role: string;
}) {
  return (
    <header className="flex h-16 flex-none items-center justify-between border-b border-border bg-background px-6">
      <div />
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm text-foreground">{email}</p>
          <p className="text-xs capitalize text-muted-foreground">
            {role.toLowerCase()}
          </p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            aria-label="Log out"
            className="rounded-full border border-border p-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <LogOut size={16} />
          </button>
        </form>
      </div>
    </header>
  );
}
