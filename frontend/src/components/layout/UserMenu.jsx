import { ChevronDown, LogOut, ScanLine, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import { initials, userDisplayName } from "../../lib/format";
import { roleLabels } from "../../lib/permissions";
import { Avatar, AvatarFallback } from "../ui/Avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/DropdownMenu";

export function UserMenu() {
  const navigate = useNavigate();
  const { user, logout, can } = useAuth();
  if (!user) return null;
  const name = userDisplayName(user);
  const role = user.is_superuser ? "Superuser" : roleLabels[user.role];

  const signOut = async () => {
    await logout();
    toast.success("Signed out");
    navigate("/login", { replace: true });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg p-1 pr-1.5 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Account menu for ${name}`}
        >
          <Avatar size="sm">
            <AvatarFallback className="bg-navy-900 text-[11px] font-semibold text-white">
              {initials(name)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-left leading-tight xl:block">
            <span className="block max-w-[140px] truncate text-sm font-medium">
              {name}
            </span>
            <span className="block text-[11px] text-muted-foreground">
              {role}
            </span>
          </span>
          <ChevronDown
            className="hidden size-3.5 text-muted-foreground xl:block"
            aria-hidden
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="truncate text-xs font-normal text-muted-foreground">
            {user.email}
          </p>
          <p className="mt-1 inline-flex rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-700">
            {role}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {can("checkIn") && (
          <DropdownMenuItem onSelect={() => navigate("/scanner")}>
            <ScanLine className="size-4" /> Open scanner
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={() => navigate("/settings")}>
          <Settings className="size-4" /> Profile & settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={signOut}>
          <LogOut className="size-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
