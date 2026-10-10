import { createECDH, randomUUID } from "node:crypto"
import { createServer, type IncomingMessage, type Server } from "node:http"
import { createRequire } from "node:module"

// Cloudflare's official always-pass, visible Turnstile test site key.
export const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA"
export const MOCK_ORGANIZATION_ID = "00000000-0000-4000-8000-00000000e2e0"
export const MOCK_SUB_ORGANIZATION_ID = "00000000-0000-4000-8000-00000000e2e1"

export type RecordedRequest = {
  method: string
  path: string
  captchaTokenPresent: boolean
  captchaConfigId: string | null
  body: Record<string, unknown> | null
}

type MockState = {
  siteKey: string | undefined
  existingAccount: boolean
  requests: RecordedRequest[]
  otpTargets: Map<string, string>
}

// Resolve @0xkey-io/crypto through Core so the mock uses the same HPKE
// implementation as the SDK that the demo actually installed.
function loadSdkCrypto(): {
  hpkeDecrypt(params: {
    ciphertextBuf: Uint8Array
    encappedKeyBuf: Uint8Array
    receiverPriv: string
    hpkeInfo?: string
  }): Uint8Array
} {
  const demoRequire = createRequire(`${process.cwd()}/package.json`)
  const coreRequire = createRequire(demoRequire.resolve("@0xkey-io/core"))
  return coreRequire("@0xkey-io/crypto")
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on("data", (chunk: Buffer) => chunks.push(chunk))
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")))
    req.on("error", reject)
  })
}

function verificationTokenFor(publicKey: string, contact: string) {
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString("base64")
  return [
    encode({ alg: "none", typ: "JWT" }),
    encode({
      id: randomUUID(),
      public_key: publicKey,
      contact,
      verification_type: "OTP_TYPE_EMAIL",
      exp: Math.floor(Date.now() / 1000) + 600,
    }),
    "e2e-unsigned",
  ].join(".")
}

export type MockAuthProxy = {
  url: string
  /** existingAccount makes OTP and wallet flows log in instead of sign up. */
  reset(options: { siteKey?: string; existingAccount?: boolean }): void
  requests(): RecordedRequest[]
  close(): Promise<void>
}

export async function startMockAuthProxy(port: number): Promise<MockAuthProxy> {
  const state: MockState = {
    siteKey: undefined,
    existingAccount: false,
    requests: [],
    otpTargets: new Map(),
  }
  const contacts = new Map<string, string>()

  const server: Server = createServer(async (req, res) => {
    const origin = req.headers.origin ?? "*"
    res.setHeader("Access-Control-Allow-Origin", origin)
    res.setHeader("Vary", "Origin")
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    res.setHeader(
      "Access-Control-Allow-Headers",
      req.headers["access-control-request-headers"] ?? "*"
    )
    if (req.method === "OPTIONS") {
      res.writeHead(204).end()
      return
    }

    const url = new URL(req.url ?? "/", `http://127.0.0.1:${port}`)
    const raw = await readBody(req)
    let body: Record<string, unknown> | null = null
    try {
      body = raw ? (JSON.parse(raw) as Record<string, unknown>) : null
    } catch {
      body = null
    }
    const token = req.headers["x-captcha-token"]
    state.requests.push({
      method: req.method ?? "",
      path: url.pathname,
      captchaTokenPresent: typeof token === "string" && token.length > 0,
      captchaConfigId: url.searchParams.get("captcha_config_id"),
      body,
    })

    const json = (status: number, payload: unknown) => {
      res.writeHead(status, { "Content-Type": "application/json" })
      res.end(JSON.stringify(payload))
    }

    switch (url.pathname) {
      case "/v1/wallet_kit_config":
        return json(200, {
          enabledProviders: ["email", "passkey", "wallet"],
          sessionExpirationSeconds: "900",
          organizationId: MOCK_ORGANIZATION_ID,
          otpAlphanumeric: false,
          otpLength: "6",
        })
      case "/v1/wallet_kit_client_params":
        return json(
          200,
          state.siteKey ? { turnstileSiteKey: state.siteKey } : {}
        )
      case "/v1/otp_init":
      case "/v1/otp_init_v2": {
        const otpId = randomUUID()
        const target = createECDH("prime256v1")
        target.generateKeys()
        state.otpTargets.set(otpId, target.getPrivateKey("hex"))
        contacts.set(otpId, String(body?.contact ?? ""))
        const otpEncryptionTargetBundle = JSON.stringify({
          data: Buffer.from(
            JSON.stringify({ targetPublic: target.getPublicKey("hex") })
          ).toString("hex"),
        })
        return json(200, { otpId, otpEncryptionTargetBundle })
      }
      case "/v1/otp_verify_v2": {
        const otpId = String(body?.otpId ?? "")
        const receiverPriv = state.otpTargets.get(otpId)
        if (!receiverPriv) return json(400, { code: 3, message: "bad otpId" })
        const bundle = JSON.parse(String(body?.encryptedOtpBundle)) as {
          encappedPublic: string
          ciphertext: string
        }
        const plaintext = loadSdkCrypto().hpkeDecrypt({
          ciphertextBuf: Buffer.from(bundle.ciphertext, "hex"),
          encappedKeyBuf: Buffer.from(bundle.encappedPublic, "hex"),
          receiverPriv,
          hpkeInfo: "0xkey_hpke",
        })
        const { public_key } = JSON.parse(
          Buffer.from(plaintext).toString("utf8")
        ) as { public_key: string }
        return json(200, {
          verificationToken: verificationTokenFor(
            public_key,
            contacts.get(otpId) ?? ""
          ),
        })
      }
      case "/v1/account":
        return json(200, {
          organizationId: state.existingAccount ? MOCK_SUB_ORGANIZATION_ID : "",
        })
      case "/v1/signup":
      case "/v1/signup_v2":
        return json(200, {
          organizationId: MOCK_SUB_ORGANIZATION_ID,
          appProofs: [],
        })
      default:
        // Session issuance is out of scope; flows stop after signup or login.
        return json(501, { code: 12, message: "not mocked", details: [] })
    }
  })

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject)
    server.listen(port, "127.0.0.1", () => resolve())
  })

  return {
    url: `http://127.0.0.1:${port}`,
    reset({ siteKey, existingAccount = false }) {
      state.siteKey = siteKey
      state.existingAccount = existingAccount
      state.requests = []
    },
    requests: () => [...state.requests],
    close: () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections()
        server.close(() => resolve())
      }),
  }
}
