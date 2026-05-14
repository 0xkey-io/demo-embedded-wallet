import Link from "next/link"

import { Button } from "./ui/button"

export default function Legal() {
  return (
    <div className="text-muted-foreground py-4 text-center text-xs">
      Secured by{" "}
      <Link
        href="https://0xkey.io"
        target="_blank"
        className="text-foreground font-medium underline underline-offset-4"
      >
        0xkey
      </Link>
      . By continuing, you agree to our{" "}
      <Button
        variant="link"
        className="text-secondary-foreground h-min p-0 text-xs"
        asChild
      >
        <Link target="_blank" href="https://0xkey.io/legal/terms">
          Terms of Service
        </Link>
      </Button>{" "}
      and{" "}
      <Button
        variant="link"
        className="text-secondary-foreground h-min p-0 text-xs"
        asChild
      >
        <Link target="_blank" href="https://0xkey.io/legal/privacy">
          Privacy Policy
        </Link>
      </Button>
      .
    </div>
  )
}
