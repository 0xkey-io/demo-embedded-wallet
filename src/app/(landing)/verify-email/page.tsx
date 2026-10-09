"use client"

import { Suspense, useCallback, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { OtpType, useZeroXKey } from "@0xkey-io/react-wallet-kit"
import { toast } from "sonner"

import { customWallet } from "@/config/0xkey"
import { LoadingButton } from "@/components/ui/button.loader"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { AuthLogo } from "@/components/logo"

const otpBundleStorageKey = (otpId: string) =>
  `0xkey:demo-embedded-wallet:otp-bundle:${otpId}`

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  )
}

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const {
    createApiKeyPair,
    createPasskey,
    verifyOtp,
    loginWithOtp,
    signUpWithOtp,
    completeOtp,
  } = useZeroXKey()

  const otpId = searchParams.get("id") || ""
  const email = searchParams.get("email") || ""
  const type = (searchParams.get("type") || "").toLowerCase()

  const [code, setCode] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const isSixDigits = useMemo(() => code.length === 6, [code])

  const handleVerify = useCallback(async () => {
    if (!otpId || !email || (type !== "passkey" && type !== "email")) {
      toast.error("Missing verification context. Please restart sign in.")
      router.replace("/")
      return
    }

    try {
      setSubmitting(true)
      const otpEncryptionTargetBundle = window.sessionStorage.getItem(
        otpBundleStorageKey(otpId)
      )
      if (!otpEncryptionTargetBundle) {
        throw new Error(
          "OTP encryption bundle not found. Please restart sign in."
        )
      }

      if (type === "passkey") {
        // The verification token is bound to this key, and signup must carry a
        // client signature from it over the exact credentials being registered.
        const publicKey = await createApiKeyPair()
        const { subOrganizationId, verificationToken } = await verifyOtp({
          otpId,
          otpCode: code,
          otpEncryptionTargetBundle,
          contact: email,
          otpType: OtpType.Email,
          publicKey,
        })
        if (!verificationToken) {
          toast.error("Verification failed. Try again.")
          return
        }

        if (subOrganizationId) {
          await loginWithOtp({ verificationToken, publicKey })
        } else {
          const passkeyName = `${window.location.hostname}-${Date.now()}`
          const passkey = await createPasskey({ name: passkeyName })
          await signUpWithOtp({
            verificationToken,
            contact: email,
            otpType: OtpType.Email,
            publicKey,
            createSubOrgParams: {
              customWallet,
              userEmail: email,
              authenticators: [
                {
                  authenticatorName: passkeyName,
                  challenge: passkey.encodedChallenge,
                  attestation: passkey.attestation,
                },
              ],
            },
          })
        }
        window.sessionStorage.removeItem(otpBundleStorageKey(otpId))
        router.replace("/dashboard")
      } else if (type === "email") {
        await completeOtp({
          otpId,
          otpCode: code,
          otpEncryptionTargetBundle,
          contact: email,
          otpType: OtpType.Email,
          createSubOrgParams: {
            customWallet,
            userEmail: email,
          },
        })
        window.sessionStorage.removeItem(otpBundleStorageKey(otpId))
        router.replace("/dashboard")
      }
    } catch (err: any) {
      const message: string = err?.message || "Verification error"
      if (message.toLowerCase().includes("invalid otp")) {
        toast.error("Invalid code. Please try again.")
      } else {
        toast.error(message)
      }
    } finally {
      setSubmitting(false)
    }
  }, [
    otpId,
    email,
    type,
    code,
    createApiKeyPair,
    createPasskey,
    verifyOtp,
    loginWithOtp,
    signUpWithOtp,
    completeOtp,
    router,
  ])

  return (
    <main className="flex w-full flex-col items-center justify-center">
      <Card className="mx-auto w-full max-w-[450px]">
        <CardHeader className="space-y-4">
          <AuthLogo />
          <CardTitle className="text-center text-xl font-medium">
            Please verify your email
          </CardTitle>
          <CardDescription className="text-center">
            Enter the 6-digit code sent to{" "}
            <span className="font-semibold">{email}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <InputOTP maxLength={6} value={code} onChange={setCode}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <LoadingButton
            className="w-full font-semibold"
            disabled={!isSixDigits || submitting}
            loading={submitting}
            onClick={handleVerify}
          >
            Verify and continue
          </LoadingButton>
        </CardContent>
      </Card>
    </main>
  )
}
