import { Toaster as SonnerToaster } from "sonner";

export function Toaster(props) {
  return (
    <SonnerToaster
      toastOptions={{
        style: {
          fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif",
          borderRadius: "0.75rem",
        },
      }}
      {...props}
    />
  );
}
