import { Moon, Sun, Plus, LogOut, User as UserIcon } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useTheme } from "@/lib/theme";
import { signOut, useAuth } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppHeader() {
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  const initials =
    user?.email?.slice(0, 2).toUpperCase() ?? "U";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur">
      <SidebarTrigger />
      <Link to="/" className="ml-1 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-primary to-brand text-primary-foreground shadow-sm">
          <span className="text-[11px] font-bold tracking-tight">PA</span>
        </div>
        <div className="hidden leading-tight sm:block">
          <div className="text-sm font-semibold tracking-tight">ProdAI</div>
          <div className="text-[10px] text-muted-foreground">Your AI Workplace Assistant</div>
        </div>
      </Link>
      <div className="ml-auto flex items-center gap-2">
        <Button asChild size="sm" className="gap-1.5">
          <Link to="/chat">
            <Plus className="h-4 w-4" /> New Session
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label="User menu"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-brand text-[11px] font-semibold text-primary-foreground">
                {initials}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="truncate">
              {user?.email ?? "Account"}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <UserIcon className="mr-2 h-4 w-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={async () => {
                await signOut();
                navigate({ to: "/login" });
              }}
            >
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
