"use client"

import { Suspense, useEffect, useMemo, useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useZeroXKey, OtpType } from "@0xkey-io/react-wallet-kit"
import { Loader, Send } from "lucide-react"
import { toast } from "sonner"

import { customWallet } from "@/config/0xkey"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AuthLogo } from "@/components/logo"

function EmailAuthContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { completeOtp } = useZeroXKey()

  const credentialBundle = searchParams.get("credentialBundle")
  const rawEmail = searchParams.get("userEmail")
  const userEmail = rawEmail?.includes(" ")
    ? rawEmail.replace(/ /g, "+")
    : rawEmail
  const otpId = searchParams.get("otpId") || ""

  const [processed, setProcessed] = useState(false)

  useEffect(() => {
    if (!credentialBundle || !userEmail || processed) return

    setProcessed(true)
    ;(async () => {
      try {
        await completeOtp({
          otpId,
          otpCode: credentialBundle,
          otpEncryptionTargetBundle: credentialBundle,
          contact: userEmail,
          otpType: OtpType.Email,
          createSubOrgParams: {
            customWallet,
            userEmail,
          },
        })
        router.replace("/dashboard")
      } catch (error: any) {
        console.error("[EmailAuth] Error:", error)
        toast.error(error?.message || "Authentication failed")
        router.replace("/")
      }
    })()
  }, [credentialBundle, userEmail, otpId, completeOtp, router, processed])

  return (
    <main className="flex w-full flex-col items-center justify-center">
      <Card className="mx-auto h-full w-full sm:w-1/2">
        <CardHeader className="space-y-4">
          <AuthLogo className="py-0" />
          <CardTitle className="flex items-center justify-center text-center">
            {credentialBundle ? (
              <div className="flex items-center gap-2">
                <Loader className="text-muted-foreground h-4 w-4 animate-spin" />
                <span className="text-base">Authenticating...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-lg font-medium">
                Confirm your email
              </div>
            )}
          </CardTitle>
          {!credentialBundle && (
            <CardDescription className="text-center">
              Click the link sent to{" "}
              <span className="font-bold">{userEmail}</span> to sign in.
            </CardDescription>
          )}
        </CardHeader>
      </Card>
    </main>
  )
}

export default function EmailAuth() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EmailAuthContent />
    </Suspense>
  )
}
