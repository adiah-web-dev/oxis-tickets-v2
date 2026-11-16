import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  ScanLine,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { FormField } from "../components/common/FormField";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { useApiMode } from "../contexts/ApiModeContext";
import { useAuth } from "../contexts/AuthContext";
import { DEMO_PASSWORD } from "../lib/demo/demoStore";
import { getApiErrorMessage } from "../lib/errors";
import { homePathFor, roleLabels } from "../lib/permissions";

const schema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Enter your email address")
    .email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

const DEMO_ACCOUNTS = [
  { role: "event_manager", email: "manager@oxbridge.edu" },
  { role: "cashier", email: "cashier@oxbridge.edu" },
  { role: "scanner", email: "scanner@oxbridge.edu" },
  { role: "staff", email: "staff@oxbridge.edu" },
];

export function LoginPage() {
  const { status, user, login } = useAuth();
  const mode = useApiMode();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state.from;
  const [serverError, setServerError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  if (status === "authenticated" && user)
    return <Navigate to={from ?? homePathFor(user)} replace />;

  const onSubmit = async (values) => {
    setServerError(null);
    try {
      const me = await login(values.email, values.password);
      navigate(from ?? homePathFor(me), { replace: true });
    } catch (error) {
      setServerError(
        getApiErrorMessage(error, "Sign-in failed. Please try again."),
      );
    }
  };

  return (
    <div className="grid min-h-screen w-full bg-background lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden flex-col justify-between bg-navy-900 p-10 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-blue-600">
            <GraduationCap className="size-5" aria-hidden />
          </span>
          <div className="leading-tight">
            <p className="font-semibold">Oxbridge International School</p>
            <p className="text-xs uppercase tracking-wider text-slate-400">
              Event Ticketing
            </p>
          </div>
        </div>
        <div className="max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">
            Run school events from order to entrance.
          </h2>
          <ul className="mt-8 space-y-4 text-sm text-slate-300">
            <li className="flex gap-3">
              <Ticket
                className="mt-0.5 size-4 shrink-0 text-blue-300"
                aria-hidden
              />
              Create orders and record payments at the front office.
            </li>
            <li className="flex gap-3">
              <ShieldCheck
                className="mt-0.5 size-4 shrink-0 text-blue-300"
                aria-hidden
              />
              Verified payments issue and email tickets automatically.
            </li>
            <li className="flex gap-3">
              <ScanLine
                className="mt-0.5 size-4 shrink-0 text-blue-300"
                aria-hidden
              />
              Scan QR codes at the door for instant check-in.
            </li>
          </ul>
        </div>
        <p className="text-xs text-slate-500">Authorised staff only.</p>
      </aside>

      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex size-9 items-center justify-center rounded-lg bg-navy-900 text-white">
              <GraduationCap className="size-5" aria-hidden />
            </span>
            <p className="font-semibold text-navy-900">
              Oxbridge Event Ticketing
            </p>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-navy-900">
            Sign in
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Use your school staff account.
          </p>

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="mt-6 space-y-4"
          >
            {serverError && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {serverError}
              </div>
            )}
            <FormField
              label="Email"
              htmlFor="email"
              error={errors.email?.message}
            >
              <Input
                id="email"
                type="email"
                autoComplete="username"
                className="h-10"
                aria-invalid={!!errors.email || undefined}
                {...register("email")}
              />
            </FormField>
            <FormField
              label="Password"
              htmlFor="password"
              error={errors.password?.message}
            >
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="h-10 pr-10"
                  aria-invalid={!!errors.password || undefined}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-slate-100"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </FormField>
            <Button
              type="submit"
              size="lg"
              className="h-10 w-full"
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              )}
              Sign in
            </Button>
          </form>

          {mode === "demo" && (
            <Card className="mt-8 gap-3 border-amber-200 bg-amber-50/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                Demo backend accounts
              </p>
              <p className="text-xs text-amber-900">
                Pick a role to see how access changes. Password:{" "}
                <code className="font-mono">{DEMO_PASSWORD}</code>
              </p>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((account) => (
                  <Button
                    key={account.email}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="justify-start bg-white"
                    onClick={() => {
                      setValue("email", account.email, {
                        shouldValidate: true,
                      });
                      setValue("password", DEMO_PASSWORD, {
                        shouldValidate: true,
                      });
                    }}
                  >
                    {roleLabels[account.role]}
                  </Button>
                ))}
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
