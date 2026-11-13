import { Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { homePathFor, roleLabels } from "../../lib/permissions";
import { EmptyState } from "../common/EmptyState";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

/** Hides a route from roles that cannot use it. The backend still enforces permissions. */
export function RequireCapability({ capability, children }) {
  const { can, user } = useAuth();
  if (can(capability)) return <>{children}</>;
  return (
    <Card>
      <EmptyState
        icon={Lock}
        title="You don’t have access to this page"
        description={`Your role (${user ? roleLabels[user.role] : "unknown"}) can’t use this area. Ask an event manager if you need access.`}
        action={
          <Button variant="outline" asChild>
            <Link to={homePathFor(user)}>Go to my home page</Link>
          </Button>
        }
      />
    </Card>
  );
}
