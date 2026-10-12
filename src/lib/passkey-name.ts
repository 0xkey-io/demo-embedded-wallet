// Same character set as @0xkey-io/core isValidPasskeyName, with the 64
// character cap its error message (and React Native) enforces.
const PASSKEY_NAME_PATTERN = /^[a-zA-Z0-9 _\-:/.]{1,64}$/

export const PASSKEY_NAME_RULE =
  "Use up to 64 letters, numbers, spaces, dashes, underscores, colons, slashes, or periods."

export function passkeyNameError(name: string): string | undefined {
  const trimmed = name.trim()
  if (!trimmed || PASSKEY_NAME_PATTERN.test(trimmed)) return undefined
  return trimmed.length > 64
    ? "Passkey name must be at most 64 characters."
    : "Passkey name can only contain letters, numbers, spaces, dashes, underscores, colons, slashes, or periods."
}

export function passkeyNameParams(name: string): {
  name?: string
  displayName?: string
} {
  const trimmed = name.trim()
  return trimmed ? { name: trimmed, displayName: trimmed } : {}
}
