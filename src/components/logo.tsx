import Image from "next/image"
import Link from "next/link"
import type { HTMLAttributes } from "react"

import { cn } from "@/lib/utils"

export function LogoMark({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("relative inline-block overflow-hidden", className)}
      aria-hidden="true"
      {...props}
    >
      <Image
        src="/logos/0xkey-monogram-mark.webp"
        alt=""
        width={512}
        height={512}
        sizes="64px"
        className="h-full w-full object-contain"
        draggable={false}
      />
    </span>
  )
}

export function LogoFull({
  className,
  markClassName,
  textClassName,
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  markClassName?: string
  textClassName?: string
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-2.5", className)}
      {...props}
    >
      <LogoMark className={cn("h-9 w-9 shrink-0", markClassName)} />
      <span
        className={cn(
          "text-lg font-extrabold leading-none tracking-[-0.055em]",
          textClassName
        )}
      >
        0xkey
      </span>
    </span>
  )
}

export function LogoLink({
  href = "https://0xkey.io",
  className,
  textClassName = "text-white",
  ...props
}: HTMLAttributes<HTMLAnchorElement> & {
  href?: string
  textClassName?: string
}) {
  return (
    <Link
      href={href}
      className={cn("inline-flex items-center", className)}
      {...props}
    >
      <LogoFull textClassName={textClassName} />
      <span className="sr-only">0xkey</span>
    </Link>
  )
}

export function AuthLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex justify-center py-2", className)}>
      <LogoFull
        markClassName="h-10 w-10"
        textClassName="text-foreground text-3xl font-semibold tracking-tight"
      />
    </div>
  )
}
