"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useWallets } from "@/providers/wallet-provider"
import { useZeroXKey } from "@0xkey-io/react-wallet-kit"
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react"
import { useLocalStorage } from "usehooks-ts"

import { PreferredWallet, Wallet } from "@/types/0xkey"
import { PREFERRED_WALLET_KEY } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Passkeys } from "@/components/passkeys"

export default function Settings() {
  const router = useRouter()
  const { user, handleVerifyEnclave } = useZeroXKey()
  const [verifyError, setVerifyError] = useState<string | undefined>()
  const [preferredWalletSetting, setPreferredWalletSetting] =
    useLocalStorage<PreferredWallet>(PREFERRED_WALLET_KEY, {
      userId: "",
      walletId: "",
    })
  const { state } = useWallets()
  const [preferredWallet, setPreferredWallet] = useState<Wallet | undefined>()
  useEffect(() => {
    if (state.wallets.length > 0) {
      const wallet = state.wallets.find(
        (wallet) => wallet.walletId === preferredWalletSetting.walletId
      )
      if (wallet) {
        setPreferredWallet(wallet)
      }
    }
  }, [state.wallets, preferredWalletSetting])

  return (
    <main className="flex items-center justify-center px-8 py-4 lg:px-36 lg:py-12">
      <div className="mx-auto w-full max-w-6xl space-y-2">
        <div className="flex items-center gap-2">
          <Button
            className="-mb-0.5 w-min sm:w-auto"
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft strokeWidth={2.5} className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold sm:text-3xl">Settings</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold sm:text-2xl">
              Login methods
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="mb-2 font-semibold sm:text-lg">Email</h3>
              <Card className="bg-card flex items-center gap-2 rounded-md p-3 sm:justify-between sm:gap-0">
                <div className="flex items-center space-x-3">
                  <Mail className="text-muted-foreground h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:block">Email</span>
                </div>
                <span className="text-muted-foreground text-xs sm:text-base">
                  {user?.userEmail}
                </span>
              </Card>
            </div>
            <Passkeys />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold sm:text-2xl">
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h3 className="mb-2 font-semibold sm:text-lg">
                Remote attestation
              </h3>
              <p className="text-muted-foreground mb-3 text-xs sm:text-sm">
                Verify that the signer enclave currently handling your wallet
                is running code approved by 0xkey&apos;s quorum multi-sig —
                not something &quot;trust us&quot;, but a cryptographically
                verifiable check you can run yourself, right now.
              </p>
              <Card className="bg-card flex items-center justify-between gap-2 rounded-md p-3">
                <div className="flex items-center space-x-3">
                  <ShieldCheck className="text-muted-foreground h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Signer enclave</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    setVerifyError(undefined)
                    try {
                      await handleVerifyEnclave({ appName: "signer" })
                    } catch (err) {
                      setVerifyError(
                        err instanceof Error ? err.message : String(err)
                      )
                    }
                  }}
                >
                  Verify enclave
                </Button>
              </Card>
              {verifyError && (
                <p className="text-destructive mt-2 text-xs">
                  {verifyError}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
