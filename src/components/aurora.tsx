import { cn } from "@/lib/utils"

interface AuroraProps {
  className?: string
  intensity?: "soft" | "strong"
}

export function Aurora({ className, intensity = "soft" }: AuroraProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden bg-[#06040c]",
        className
      )}
    >
      <div
        className={cn(
          "absolute -inset-[20%] animate-aurora-shift",
          intensity === "strong" ? "opacity-80" : "opacity-55"
        )}
        style={{
          filter: "blur(90px)",
          background:
            "radial-gradient(ellipse 45% 55% at 25% 30%, hsl(var(--aurora-1) / 0.55) 0%, transparent 70%), radial-gradient(ellipse 35% 45% at 75% 40%, hsl(var(--aurora-2) / 0.5) 0%, transparent 70%)",
        }}
      />
      <div
        className={cn(
          "absolute -inset-[20%] animate-aurora-shift",
          intensity === "strong" ? "opacity-70" : "opacity-45"
        )}
        style={{
          filter: "blur(90px)",
          animationDelay: "-9s",
          animationDirection: "reverse",
          background:
            "radial-gradient(ellipse 40% 50% at 55% 75%, hsl(var(--aurora-3) / 0.55) 0%, transparent 70%)",
        }}
      />
    </div>
  )
}
