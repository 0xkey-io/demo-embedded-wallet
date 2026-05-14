"use client"

import { useEffect, useState } from "react"
import { SiX } from "@icons-pack/react-simple-icons"
import { useZeroXKey } from "@0xkey-io/react-wallet-kit"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

const XAuth = () => {
  const { handleXOauth, clientState } = useZeroXKey()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(!!clientState)
  }, [clientState])

  const onClick = async () => {
    try {
      await handleXOauth({
        openInPage: false,
      })
    } catch (error: any) {
      const message: string = error?.message || "X login failed"
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
            <SiX className="h-4 w-4" />
            <span className="grow text-center font-normal">Continue with X</span>
          </Button>
        </div>
      ) : (
        <Skeleton className="h-10 w-full" />
      )}
    </>
  )
}

export default XAuth
