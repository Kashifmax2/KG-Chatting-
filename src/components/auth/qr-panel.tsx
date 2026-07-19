import { QrCode } from "lucide-react";

/** The decorative "Log in with QR code" panel on the auth screens. */
export function QrPanel() {
  return (
    <div className="hidden w-72 flex-col items-center justify-center border-l border-border p-8 text-center md:flex">
      <div className="relative flex h-40 w-40 items-center justify-center rounded-lg bg-white p-3">
        {/* Fake but tidy QR grid */}
        <div className="grid h-full w-full grid-cols-8 grid-rows-8 gap-0.5">
          {Array.from({ length: 64 }).map((_, i) => {
            // Deterministic pseudo-random pattern.
            const on = (i * 7 + (i % 5) * 3) % 3 !== 0;
            const corner =
              (i < 3 || (i >= 8 && i < 11) || (i >= 16 && i < 19)) &&
              i % 8 < 3;
            return (
              <div
                key={i}
                className={on || corner ? "bg-[#1e1f22]" : "bg-transparent"}
              />
            );
          })}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand text-white">
            <QrCode className="h-6 w-6" />
          </div>
        </div>
      </div>
      <h2 className="mt-6 text-xl font-bold">Log in with QR Code</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Scan this with the mobile app to log in instantly.
      </p>
    </div>
  );
}
