import { BrowserQRCodeReader } from "@zxing/browser";
import { useCallback, useEffect, useRef, useState } from "react";

function describeCameraError(error) {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError")
    return "Camera access was blocked. Allow camera permission in your browser settings, or enter the ticket ID manually.";
  if (name === "NotFoundError" || name === "OverconstrainedError")
    return "No camera was found on this device. Use manual entry instead.";
  if (name === "NotReadableError")
    return "The camera is being used by another app. Close it and try again.";
  if (typeof window !== "undefined" && !window.isSecureContext)
    return "Camera scanning requires a secure (HTTPS) connection.";
  return "The camera could not be started. Try again or use manual entry.";
}

/** Wraps @zxing/browser to decode QR codes from the device camera. */
export function useQrScanner(onDecode) {
  const videoRef = useRef < HTMLVideoElement > null;
  const controlsRef = (useRef < IScannerControls) | (null > null);
  const onDecodeRef = useRef(onDecode);
  const [status, setStatus] = useState < CameraStatus > "idle";
  const [error, setError] = (useState < string) | (null > null);

  onDecodeRef.current = onDecode;

  const stop = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setStatus("idle");
  }, []);

  const start = useCallback(async () => {
    if (!videoRef.current || controlsRef.current) return;
    setStatus("starting");
    setError(null);
    try {
      const reader = new BrowserQRCodeReader(undefined, {
        delayBetweenScanAttempts: 120,
      });
      controlsRef.current = await reader.decodeFromConstraints(
        { video: { facingMode: { ideal: "environment" } }, audio: false },
        videoRef.current,
        (result) => {
          if (result) onDecodeRef.current(result.getText());
        },
      );
      setStatus("scanning");
    } catch (e) {
      controlsRef.current = null;
      setError(describeCameraError(e));
      setStatus("error");
    }
  }, []);

  useEffect(() => () => controlsRef.current?.stop(), []);

  return { videoRef, status, error, start, stop };
}
