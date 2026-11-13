import { Loader2 } from "lucide-react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export function RequireAuth({ children }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return (
      <div
        className="flex min-h-screen w-full items-center justify-center bg-background"
        role="status"
      >
        <Loader2 className="size-6 animate-spin text-blue-600" aria-hidden />
        <span className="sr-only">Restoring your session…</span>
      </div>
    );
  }
  if (status === "unauthenticated")
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  return <>{children}</>;
}
