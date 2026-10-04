import { LogOut } from "lucide-react";
import type { SessionUser } from "@/lib/auth/session";
import { signOutAction } from "@/app/(auth)/login/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MobileNav } from "./mobile-nav";
import { NAV, ROLE_LABEL } from "./nav-config";

export function Topbar({ user }: { user: SessionUser }) {
  return (
    <header className="flex h-16 items-center gap-3 border-b border-border bg-background px-4 md:px-8">
      <MobileNav items={NAV[user.role]} />
      <div className="flex-1" />
      <div className="hidden text-right sm:block">
        <p className="text-sm font-medium leading-tight">{user.name}</p>
        <p className="text-xs text-muted-foreground">{user.email}</p>
      </div>
      <Badge variant="accent">{ROLE_LABEL[user.role]}</Badge>
      <form action={signOutAction}>
        <Button type="submit" variant="outline" size="sm">
          <LogOut className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Sign out</span>
        </Button>
      </form>
    </header>
  );
}
