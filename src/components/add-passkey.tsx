import { useState } from "react"
import { useZeroXKey } from "@0xkey-io/react-wallet-kit"
import { toast } from "sonner"

import {
  PASSKEY_NAME_RULE,
  passkeyNameError,
  passkeyNameParams,
} from "@/lib/passkey-name"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

export default function AddPasskey({
  onPasskeyAdded,
}: {
  onPasskeyAdded: (authenticatorId: string) => void
}) {
  const { user, handleAddPasskey } = useZeroXKey()

  const [open, setOpen] = useState(false)
  const [passkeyName, setPasskeyName] = useState("")
  const [adding, setAdding] = useState(false)
  const nameError = passkeyNameError(passkeyName)

  const _handleAddPasskey = async () => {
    if (!user || nameError) {
      return
    }

    setAdding(true)
    try {
      const [authenticatorId] = await handleAddPasskey({
        ...passkeyNameParams(passkeyName),
        userId: user?.userId,
      })

      if (authenticatorId) {
        toast.success("Passkey added!")
        onPasskeyAdded(authenticatorId)
      }
      setOpen(false)
      setPasskeyName("")
    } catch (error: any) {
      toast.error(error?.message || "Failed to add passkey")
    } finally {
      setAdding(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="text-xs sm:text-sm" variant="outline" size="sm">
          Add Passkey
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-left">Add Passkey</DialogTitle>
          <DialogDescription className="text-left">
            Help identify your passkey by giving it a unique name, or leave it
            blank to use a generated one.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label
              htmlFor="passkey-name"
              className="text-left text-sm font-medium"
            >
              Passkey name
            </label>
            <Input
              id="passkey-name"
              placeholder="e.g. MacBook Touch ID"
              value={passkeyName}
              aria-invalid={!!nameError}
              aria-describedby="passkey-name-hint"
              onChange={(e) => setPasskeyName(e.target.value)}
            />
            <p
              id="passkey-name-hint"
              className={
                nameError
                  ? "text-destructive text-left text-xs"
                  : "text-muted-foreground text-left text-xs"
              }
            >
              {nameError ?? PASSKEY_NAME_RULE}
            </p>
          </div>
        </div>
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={_handleAddPasskey} disabled={!!nameError || adding}>
            Add Passkey
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
