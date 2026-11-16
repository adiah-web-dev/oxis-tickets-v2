import { Menu } from "lucide-react";
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useApiMode } from "../../contexts/ApiModeContext";
import { useAuth } from "../../contexts/AuthContext";
import { getBreadcrumbs } from "../../lib/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/Breadcrumb";
import { Button } from "../ui/Button";
import { EventSelector } from "./EventSelector";
import { NotificationsMenu } from "./NotificationsMenu";
import { UserMenu } from "./UserMenu";

export function TopBar({ onOpenNav }) {
  const { pathname } = useLocation();
  const crumbs = getBreadcrumbs(pathname);
  const title = crumbs[crumbs.length - 1].label;
  const mode = useApiMode();
  const { can } = useAuth();
  const scopedSection =
    ["/orders", "/tickets", "/emails"].some((p) => pathname === p) ||
    pathname === "/";
  const showEventSelector = can("viewOrders") && scopedSection;

  return (
    <header className="sticky top-0 z-30 border-b bg-white">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          size="icon"
          className="size-9 md:hidden"
          onClick={onOpenNav}
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </Button>

        <div className="min-w-0 flex-1">
          {crumbs.length > 1 && (
            <Breadcrumb className="hidden sm:block">
              <BreadcrumbList className="text-xs">
                {crumbs.map((crumb, i) => (
                  <React.Fragment key={crumb.label}>
                    {i > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      {crumb.to ? (
                        <BreadcrumbLink asChild>
                          <Link to={crumb.to}>{crumb.label}</Link>
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          )}
          <div className="flex items-center gap-2">
            <h1 className="truncate text-lg font-semibold tracking-tight text-navy-900">
              {title}
            </h1>
            {mode === "demo" && (
              <span className="hidden rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 sm:inline">
                Demo data
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {showEventSelector && <EventSelector className="hidden md:flex" />}
          <NotificationsMenu />
          <UserMenu />
        </div>
      </div>
      {showEventSelector && (
        <div className="border-t px-4 py-2 md:hidden">
          <EventSelector />
        </div>
      )}
    </header>
  );
}
