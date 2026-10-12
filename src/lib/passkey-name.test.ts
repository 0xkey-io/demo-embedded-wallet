import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { passkeyNameError, passkeyNameParams } from "./passkey-name.ts"

describe("passkeyNameError", () => {
  it("accepts names the SDK accepts", () => {
    for (const name of [
      "MacBook Touch ID",
      "yubikey_5c-nfc",
      "work/laptop:1",
      "ZeroXKey Passkey-1760252400000",
      "v1.2",
      "x".repeat(64),
    ]) {
      assert.equal(passkeyNameError(name), undefined, name)
    }
  })

  it("accepts a blank name so the SDK generates the default", () => {
    assert.equal(passkeyNameError(""), undefined)
    assert.equal(passkeyNameError("   "), undefined)
  })

  it("rejects characters the SDK rejects", () => {
    for (const name of [
      "me@example.com",
      "Torben's MacBook",
      "MacBook (Touch ID)",
      "我的电脑",
      "laptop 🙂",
    ]) {
      assert.match(passkeyNameError(name) ?? "", /letters, numbers/, name)
    }
  })

  it("rejects names longer than 64 characters", () => {
    assert.match(passkeyNameError("x".repeat(65)) ?? "", /64 characters/)
  })
})

describe("passkeyNameParams", () => {
  it("passes a trimmed name as both name and display name", () => {
    assert.deepEqual(passkeyNameParams("  Work laptop "), {
      name: "Work laptop",
      displayName: "Work laptop",
    })
  })

  it("omits the name when blank so the SDK default is used", () => {
    assert.deepEqual(passkeyNameParams("  "), {})
  })
})
