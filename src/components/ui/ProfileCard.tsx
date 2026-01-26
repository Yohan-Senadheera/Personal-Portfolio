import React from "react";

export function ProfileCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-xl">
      {/* glow */}
      <div
        className="pointer-events-none absolute -inset-24 opacity-60"
        style={{
          background:
            "radial-gradient(400px circle at 30% 20%, rgba(99,102,241,0.25), transparent 55%)",
        }}
      />

      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Profile
          </span>
          <span className="text-xs text-primary/80">Online</span>
        </div>

        <div className="relative rounded-xl overflow-hidden border border-white/10">
          <img
            src="src\assets\me.jpg"
            alt="Yohan Senadheera"
            className="w-full h-56 object-cover  contrast-110"
          />
          {/* overlay grid/noise */}
          <div
            className="pointer-events-none absolute inset-0 opacity-35 mix-blend-overlay"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
              backgroundSize: "22px 22px",
            }}
          />
          {/* bottom fade */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />
        </div>

        <div className="mt-4 space-y-3">
          <div className="text-lg font-semibold">Yohan Senadheera</div>

          <div className="text-sm text-muted-foreground leading-snug">
            Computer Engineering Undergraduate <br />
            Focused on Networking, Software Engineering and Devops
          </div>

          {/* Quick glance info */}
          <div className="mt-4 space-y-2 text-xs">
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <span className="text-muted-foreground">Status</span>
              <span className="text-foreground font-medium">Final Year UG</span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <span className="text-muted-foreground">Location</span>
              <span className="text-foreground font-medium">Sri Lanka</span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/10 px-3 py-2">
              <span className="text-muted-foreground">Availability</span>
              <span className="text-primary font-semibold">
                Open for Internships
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
