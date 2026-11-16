import {
  GraduationCap,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useApiMode } from "../../contexts/ApiModeContext";
import { useAuth } from "../../contexts/AuthContext";
import { primaryNav, secondaryNav } from "../../lib/navigation";
import { cn } from "../../lib/utils";

export function Sidebar({
  collapsed = false,
  canCollapse,
  onToggleCollapse,
  onNavigate,
}) {
  const navigate = useNavigate();
  const mode = useApiMode();
  const { can } = useAuth();
  const visible = (items) =>
    items.filter((item) => !item.capability || can(item.capability));

  const renderItem = (item) => (
    <li key={item.to}>
      <NavLink
        to={item.to}
        end={item.to === "/"}
        onClick={onNavigate}
        title={collapsed ? item.label : undefined}
        className={({ isActive }) =>
          cn(
            "group flex h-9 items-center gap-3 rounded-lg px-2.5 text-sm font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
            isActive
              ? "bg-white/10 text-white"
              : "text-slate-300 hover:bg-white/5 hover:text-white",
            collapsed && "justify-center px-0",
          )
        }
      >
        {({ isActive }) => (
          <>
            <item.icon
              className={cn(
                "size-[18px] shrink-0",
                isActive
                  ? "text-blue-300"
                  : "text-slate-400 group-hover:text-slate-200",
              )}
              aria-hidden
            />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </>
        )}
      </NavLink>
    </li>
  );

  return (
    <div className="flex h-full w-full flex-col bg-navy-900 text-slate-200">
      <div
        className={cn(
          "flex h-16 items-center gap-2.5 border-b border-white/10 px-4",
          collapsed && "justify-center px-0",
        )}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
          <GraduationCap className="size-[18px]" aria-hidden />
        </span>
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold text-white">
              Oxbridge International
            </p>
            <p className="truncate text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Event Ticketing
            </p>
          </div>
        )}
      </div>

      {can("createOrders") && (
        <div className={cn("px-3 pt-4", collapsed && "px-2")}>
          <button
            type="button"
            onClick={() => {
              navigate("/orders/new");
              onNavigate?.();
            }}
            title={collapsed ? "New order" : undefined}
            className={cn(
              "flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-medium text-white transition-colors hover:bg-blue-500",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900",
            )}
          >
            <Plus className="size-4" aria-hidden />
            {!collapsed && "New order"}
          </button>
        </div>
      )}

      <nav
        aria-label="Main"
        className={cn("flex-1 overflow-y-auto px-3 py-4", collapsed && "px-2")}
      >
        {!collapsed && (
          <p className="mb-2 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Manage
          </p>
        )}
        <ul className="flex flex-col gap-0.5">
          {visible(primaryNav).map(renderItem)}
        </ul>
      </nav>

      <div
        className={cn(
          "border-t border-white/10 px-3 py-3",
          collapsed && "px-2",
        )}
      >
        <ul className="flex flex-col gap-0.5">
          {visible(secondaryNav).map(renderItem)}
        </ul>
        {!collapsed && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/5 px-2.5 py-2">
            <span
              className={cn(
                "size-2 rounded-full",
                mode === "live" ? "bg-emerald-400" : "bg-amber-400",
              )}
              aria-hidden
            />
            <p className="text-xs text-slate-300">
              {mode === "live" ? "Connected to live API" : "Demo backend"}
            </p>
          </div>
        )}
        {canCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={cn(
              "mt-2 flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-xs font-medium text-slate-400 hover:bg-white/5 hover:text-white",
              collapsed && "justify-center px-0",
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
            {!collapsed && "Collapse"}
          </button>
        )}
      </div>
    </div>
  );
}
