"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader } from "lucide-react"

import { Card, CardHeader, CardTitle } from "@/components/ui/card"

/**
 * Facebook OAuth uses popup mode via handleFacebookOauth in react-wallet-kit.
 * This redirect callback page is kept for backwards compatibility only —
 * it simply redirects back to the landing page.
 */
export function FacebookProcessCallback() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/")
  }, [router])

  return (
    <main className="flex w-full flex-col items-center justify-center">
      <Card className="mx-auto h-full w-full sm:w-1/2">
        <CardHeader className="space-y-4">
          <div className="py-2 text-center text-5xl font-semibold tracking-tight">
            0xkey
          </div>
          <CardTitle className="flex items-center justify-center text-center">
            <div className="flex items-center gap-2">
              <Loader className="text-muted-foreground h-4 w-4 animate-spin" />
              <span className="text-base">Redirecting...</span>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>
    </main>
  )
}
