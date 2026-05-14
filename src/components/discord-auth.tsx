"use client"

import { useEffect, useState } from "react"
import { SiDiscord } from "@icons-pack/react-simple-icons"
import { useZeroXKey } from "@0xkey-io/react-wallet-kit"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

const DiscordAuth = () => {
  const { handleDiscordOauth, clientState } = useZeroXKey()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(!!clientState)
  }, [clientState])

  const onClick = async () => {
    try {
      await handleDiscordOauth({
        openInPage: false,
      })
    } catch (error: any) {
      const message: string = error?.message || "Discord login failed"
      toast.error(message)
    }
  }

  return (
    <>
      {ready ? (
        <div className="flex w-full justify-center">
          <Button
            variant="outline"
            className="flex w-[235px] items-center justify-between"
            onClick={onClick}
          >
            <SiDiscord className="h-4 w-4 text-[#5865F2]" />
            <span className="grow text-center font-normal">
              Continue with Discord
            </span>
          </Button>
        </div>
      ) : (
        <Skeleton className="h-10 w-full" />
      )}
    </>
  )
}

export default DiscordAuth
