import { motion } from "framer-motion";
import { Camera, CameraOff, Loader2, VideoOff } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/Button";

export function CameraViewport({
  videoRef,
  status,
  error,
  paused,
  onStart,
  onStop,
}) {
  const active = status === "scanning";

  return (
    <div className="space-y-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-navy-950 sm:aspect-[4/3]">
        <video
          ref={videoRef}
          muted
          playsInline
          className={cn(
            "absolute inset-0 size-full object-cover",
            !active && "opacity-0",
          )}
          aria-label="Camera preview"
        />

        {/* Target frame */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative aspect-square w-[62%] max-w-[320px]">
            {[
              "left-0 top-0 border-l-4 border-t-4 rounded-tl-xl",
              "right-0 top-0 border-r-4 border-t-4 rounded-tr-xl",
              "left-0 bottom-0 border-l-4 border-b-4 rounded-bl-xl",
              "right-0 bottom-0 border-r-4 border-b-4 rounded-br-xl",
            ].map((pos) => (
              <span
                key={pos}
                className={cn(
                  "absolute size-10",
                  pos,
                  paused ? "border-white/40" : "border-white",
                )}
              />
            ))}
            {active && !paused && (
              <motion.span
                className="absolute inset-x-3 h-0.5 rounded-full bg-blue-400"
                initial={{ top: "8%" }}
                animate={{ top: ["8%", "92%", "8%"] }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            )}
          </div>
        </div>

        {!active && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center text-white">
            {status === "starting" ? (
              <>
                <Loader2
                  className="size-8 animate-spin text-blue-300"
                  aria-hidden
                />
                <p className="text-sm text-slate-300">Starting camera…</p>
              </>
            ) : status === "error" ? (
              <>
                <VideoOff className="size-9 text-red-300" aria-hidden />
                <p role="alert" className="max-w-xs text-sm text-slate-200">
                  {error}
                </p>
                <Button
                  onClick={onStart}
                  className="bg-white text-navy-900 hover:bg-slate-100"
                >
                  Try again
                </Button>
              </>
            ) : (
              <>
                <span className="flex size-14 items-center justify-center rounded-full bg-white/10">
                  <Camera className="size-7" aria-hidden />
                </span>
                <div>
                  <p className="text-base font-semibold">Ready to scan</p>
                  <p className="mt-1 text-sm text-slate-300">
                    Point the camera at the QR code on the ticket.
                  </p>
                </div>
                <Button
                  size="lg"
                  onClick={onStart}
                  className="h-12 bg-blue-600 px-6 text-base text-white hover:bg-blue-500"
                >
                  <Camera className="size-5" aria-hidden /> Start camera
                </Button>
              </>
            )}
          </div>
        )}

        {active && (
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-navy-950/70 px-4 py-2.5 text-xs text-white">
            <span className="inline-flex items-center gap-2">
              <span
                className={cn(
                  "size-2 rounded-full",
                  paused ? "bg-amber-400" : "animate-pulse bg-emerald-400",
                )}
                aria-hidden
              />
              {paused ? "Paused — resolve the current ticket" : "Scanning…"}
            </span>
            <button
              type="button"
              onClick={onStop}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 hover:bg-white/10"
            >
              <CameraOff className="size-3.5" aria-hidden /> Stop
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
