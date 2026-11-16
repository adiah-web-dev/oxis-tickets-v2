import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2,
  Loader2,
  Server,
  UserRound,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { FormField } from "../components/common/FormField";
import { StatusBadge } from "../components/common/StatusBadge";
import { Button } from "../components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Separator } from "../components/ui/Separator";
import { Switch } from "../components/ui/Switch";
import { useApiMode } from "../contexts/ApiModeContext";
import { useAuth } from "../contexts/AuthContext";
import { useScannerPreferences } from "../hooks/useScannerPreferences";
import { API_BASE_URL } from "../lib/apiClient";
import { getApiErrorMessage, getFieldErrors } from "../lib/errors";
import { roleLabels } from "../lib/permissions";
import { getCurrentUser, updateCurrentUser } from "../services/authService";

const profileSchema = z.object({
  first_name: z.string().trim().max(150),
  last_name: z.string().trim().max(150),
});

export function SettingsPage() {
  const mode = useApiMode();
  const { user, setUser, can } = useAuth();
  const [prefs, setPrefs] = useScannerPreferences();
  const [test, setTest] = useState({ phase: "idle" });
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({ resolver: zodResolver(profileSchema) });

  useEffect(() => {
    if (user) reset({ first_name: user.first_name, last_name: user.last_name });
  }, [user, reset]);

  const saveProfile = async (values) => {
    try {
      const updated = await updateCurrentUser(values);
      setUser(updated);
      toast.success("Profile updated");
    } catch (error) {
      const fields = getFieldErrors(error);
      ["first_name", "last_name"].forEach(
        (f) => fields[f] && setError(f, { message: fields[f] }),
      );
      toast.error("Profile could not be saved", {
        description: getApiErrorMessage(error),
      });
    }
  };

  const runTest = async () => {
    setTest({ phase: "testing" });
    try {
      const me = await getCurrentUser();
      setTest({ phase: "ok", email: me.email });
    } catch (error) {
      setTest({ phase: "error", message: getApiErrorMessage(error) });
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <p className="text-sm text-muted-foreground">
        Your profile, connection details and preferences for this device.
      </p>

      {user && (
        <Card className="gap-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[15px]">
              <UserRound className="size-4 text-slate-500" aria-hidden />{" "}
              Profile
            </CardTitle>
            <CardDescription>
              {user.email} ·{" "}
              <span className="font-medium text-foreground">
                {user.is_superuser ? "Superuser" : roleLabels[user.role]}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit(saveProfile)}
              noValidate
              className="space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="First name"
                  htmlFor="first_name"
                  error={errors.first_name?.message}
                >
                  <Input
                    id="first_name"
                    autoComplete="given-name"
                    {...register("first_name")}
                  />
                </FormField>
                <FormField
                  label="Last name"
                  htmlFor="last_name"
                  error={errors.last_name?.message}
                >
                  <Input
                    id="last_name"
                    autoComplete="family-name"
                    {...register("last_name")}
                  />
                </FormField>
              </div>
              <p className="text-xs text-muted-foreground">
                Roles are assigned by an administrator.
              </p>
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting || !isDirty}>
                  {isSubmitting && (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  )}
                  Save profile
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="gap-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[15px]">
            <Server className="size-4 text-slate-500" aria-hidden /> API
            connection
          </CardTitle>
          <CardDescription>
            The Django REST Framework backend this dashboard talks to,
            authenticated with JWT.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-3 text-sm sm:grid-cols-[160px_1fr]">
            <dt className="text-muted-foreground">Base URL (VITE_API_URL)</dt>
            <dd className="font-mono text-[13px]">{API_BASE_URL}</dd>
            <dt className="text-muted-foreground">Data source</dt>
            <dd>
              <StatusBadge
                label={mode === "live" ? "Live API" : "Demo data"}
                tone={mode === "live" ? "success" : "warning"}
              />
              {mode === "demo" && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Sample data held in the browser that mimics the backend’s
                  rules. Nothing is sent to the server.
                </p>
              )}
            </dd>
          </dl>
          <Separator />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={runTest}
              disabled={test.phase === "testing"}
            >
              {test.phase === "testing" && (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              )}
              Test connection
            </Button>
            {test.phase === "ok" && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-700">
                <CheckCircle2 className="size-4" aria-hidden /> Connected as{" "}
                {test.email}
              </span>
            )}
            {test.phase === "error" && (
              <span
                role="alert"
                className="flex items-center gap-1.5 text-sm text-red-700"
              >
                <XCircle className="size-4 shrink-0" aria-hidden />{" "}
                {test.message}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {can("checkIn") && (
        <Card className="gap-4">
          <CardHeader>
            <CardTitle className="text-[15px]">Scanner</CardTitle>
            <CardDescription>
              Saved on this device — set them on each entrance tablet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {can("viewTickets") && (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Label htmlFor="pref-auto" className="text-sm font-medium">
                      Automatic check-in
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Check valid tickets in immediately after scanning, without
                      a confirm tap.
                    </p>
                  </div>
                  <Switch
                    id="pref-auto"
                    checked={prefs.autoCheckIn}
                    onCheckedChange={(v) => setPrefs({ autoCheckIn: v })}
                  />
                </div>
                <Separator />
              </>
            )}
            <div className="flex items-start justify-between gap-4">
              <div>
                <Label htmlFor="pref-sound" className="text-sm font-medium">
                  Scan sounds
                </Label>
                <p className="text-sm text-muted-foreground">
                  Play a short tone for valid, duplicate and invalid tickets.
                </p>
              </div>
              <Switch
                id="pref-sound"
                checked={prefs.sound}
                onCheckedChange={(v) => setPrefs({ sound: v })}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
