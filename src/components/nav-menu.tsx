import Link from "next/link"

import Account from "./account"
import { LogoFull } from "./logo"
import { Badge } from "./ui/badge"

export default function NavMenu() {
  return (
    <div className="flex h-20 items-center justify-between gap-4 bg-black p-4 sm:px-10">
      <div className="flex items-center gap-1">
        <Link href="/dashboard" className="inline-flex items-center">
          <LogoFull textClassName="text-3xl font-semibold tracking-tight text-white sm:text-4xl" />
        </Link>
        <Badge variant="outline" className="bg-black/80 text-xs text-white">
          Demo
        </Badge>
      </div>
      <div className="flex items-center justify-center gap-4">
        <Account />
      </div>
    </div>
  )
}
