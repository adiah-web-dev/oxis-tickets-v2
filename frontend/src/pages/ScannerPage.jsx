import { Keyboard, QrCode, Search, Volume2, VolumeX, Zap } from "lucide-react";
import { useState } from "react";
import { CameraViewport } from "../components/scanner/CameraViewport";
import { ScanLog } from "../components/scanner/ScanLog";
import { ScanResultPanel } from "../components/scanner/ScanResultPanel";
import { Button } from "../components/ui/Button";
import { Card, CardHeader, CardTitle } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Switch } from "../components/ui/Switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/Tabs";
import { useAuth } from "../contexts/AuthContext";
import { useQrScanner } from "../hooks/useQrScanner";
import { useScannerPreferences } from "../hooks/useScannerPreferences";
import { useTicketScanner } from "../hooks/useTicketScanner";

export function ScannerPage() {
  const [prefs, setPrefs] = useScannerPreferences();
  const { can } = useAuth();
  // Roles that can read tickets preview before confirming; scanner-only roles check in on scan.
  const canPreview = can("viewTickets");
  const { state, log, lookup, confirm, reset } = useTicketScanner({
    ...prefs,
    canPreview,
  });
  const [mode, setMode] = useState("camera");
  const [manualCode, setManualCode] = useState("");
  const paused = state.phase !== "idle";
  const camera = useQrScanner((text) => {
    if (!paused) void lookup(text);
  });

  const submitManual = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    void lookup(manualCode);
  };

  const handleReset = () => {
    reset();
    setManualCode("");
  };

  const counts = {
    checkedIn: log.filter((l) => l.outcome === "checked-in").length,
    issues: log.filter(
      (l) => l.outcome === "invalid" || l.outcome === "already",
    ).length,
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {canPreview
            ? "Scan tickets at the entrance. Valid tickets turn blue, check-ins turn green."
            : "Each scan checks the ticket in immediately. Green means admit."}
        </p>
        <div className="flex items-center gap-4 rounded-lg border bg-white px-3 py-2">
          {canPreview && (
            <>
              <div className="flex items-center gap-2">
                <Switch
                  id="auto-check-in"
                  checked={prefs.autoCheckIn}
                  onCheckedChange={(v) => setPrefs({ autoCheckIn: v })}
                />
                <Label
                  htmlFor="auto-check-in"
                  className="flex items-center gap-1 text-sm"
                >
                  <Zap className="size-3.5 text-amber-500" aria-hidden /> Auto
                  check-in
                </Label>
              </div>
              <span className="h-4 w-px bg-slate-200" aria-hidden />
            </>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setPrefs({ sound: !prefs.sound })}
            aria-label={prefs.sound ? "Mute scan sounds" : "Enable scan sounds"}
            aria-pressed={prefs.sound}
          >
            {prefs.sound ? (
              <Volume2 className="size-4" />
            ) : (
              <VolumeX className="size-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Tabs
            value={mode}
            onValueChange={(v) => {
              setMode(v);
              if (v === "manual") camera.stop();
            }}
          >
            <TabsList className="grid h-11 w-full grid-cols-2">
              <TabsTrigger value="camera" className="h-9 text-sm">
                <QrCode className="size-4" aria-hidden /> Camera
              </TabsTrigger>
              <TabsTrigger value="manual" className="h-9 text-sm">
                <Keyboard className="size-4" aria-hidden /> Manual entry
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="camera"
              forceMount
              className="mt-4 data-[state=inactive]:hidden"
            >
              <CameraViewport
                videoRef={camera.videoRef}
                status={camera.status}
                error={camera.error}
                paused={paused}
                onStart={camera.start}
                onStop={camera.stop}
              />
            </TabsContent>

            <TabsContent value="manual" className="mt-4">
              <Card className="gap-4 p-5 sm:p-6">
                <form onSubmit={submitManual} className="space-y-4">
                  <div>
                    <Label
                      htmlFor="manual-code"
                      className="text-sm font-medium"
                    >
                      Ticket code
                    </Label>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Type the code printed under the QR code on the ticket.
                    </p>
                  </div>
                  <Input
                    id="manual-code"
                    value={manualCode}
                    onChange={(e) =>
                      setManualCode(e.target.value.toUpperCase())
                    }
                    placeholder="OXB…"
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    autoFocus
                    className="h-14 font-mono text-xl tracking-wide"
                  />
                  <Button
                    type="submit"
                    size="lg"
                    className="h-12 w-full text-base"
                    disabled={
                      !manualCode.trim() ||
                      state.phase === "looking-up" ||
                      state.phase === "checking-in"
                    }
                  >
                    <Search className="size-5" aria-hidden />{" "}
                    {canPreview ? "Look up ticket" : "Check in ticket"}
                  </Button>
                </form>
              </Card>
            </TabsContent>
          </Tabs>

          <Card className="hidden gap-0 overflow-hidden p-0 lg:flex">
            <CardHeader className="flex flex-row items-center justify-between border-b px-4 py-3">
              <CardTitle className="text-sm">This session</CardTitle>
              <span className="text-xs text-muted-foreground tabular-nums">
                {counts.checkedIn} checked in · {counts.issues} issues
              </span>
            </CardHeader>
            <ScanLog entries={log.slice(0, 6)} />
          </Card>
        </div>

        <ScanResultPanel
          state={state}
          onConfirm={confirm}
          onReset={handleReset}
        />

        <Card className="gap-0 overflow-hidden p-0 lg:hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b px-4 py-3">
            <CardTitle className="text-sm">This session</CardTitle>
            <span className="text-xs text-muted-foreground tabular-nums">
              {counts.checkedIn} checked in · {counts.issues} issues
            </span>
          </CardHeader>
          <ScanLog entries={log.slice(0, 5)} />
        </Card>
      </div>
    </div>
  );
}
