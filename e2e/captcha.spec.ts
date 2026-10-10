import { expect, test, type Page } from "@playwright/test"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"

import {
  startMockAuthProxy,
  TURNSTILE_TEST_SITE_KEY,
  type MockAuthProxy,
  type RecordedRequest,
} from "./mock-auth-proxy"
import { MOCK_AUTH_PROXY_PORT } from "./ports"

const AUTH_PROXY_CONFIG_ID = "00000000-0000-4000-8000-0000000000b1"
const PROTECTED_PATHS = [
  "/v1/otp_init",
  "/v1/otp_init_v2",
  "/v1/signup",
  "/v1/signup_v2",
]

let mock: MockAuthProxy

test.beforeAll(async ({ baseURL }) => {
  mock = await startMockAuthProxy(MOCK_AUTH_PROXY_PORT)
  // next dev compiles routes on first visit; do it before any timed flow.
  for (const route of ["/", "/verify-email"]) await fetch(`${baseURL}${route}`)
})

test.afterAll(async () => {
  await mock?.close()
})

function requestsTo(paths: string[]): RecordedRequest[] {
  return mock.requests().filter((request) => paths.includes(request.path))
}

/** Records Turnstile script loads and widget frames without reading tokens. */
function watchTurnstile(page: Page) {
  const seen = { script: 0, frames: 0 }
  page.on("request", (request) => {
    if (request.url().startsWith("https://challenges.cloudflare.com/turnstile"))
      seen.script += 1
  })
  page.on("frameattached", (frame) => {
    void frame
      .waitForURL(/challenges\.cloudflare\.com/, { timeout: 30_000 })
      .then(() => {
        seen.frames += 1
      })
      .catch(() => undefined)
  })
  return seen
}

async function openDemo(page: Page, expectedStatus: RegExp) {
  await page.goto("/")
  await expect(page.getByTestId("captcha-diagnostics-status")).toHaveText(
    expectedStatus
  )
  await expect(page.getByTestId("captcha-diagnostics")).toHaveAttribute(
    "data-client-state",
    "ready"
  )
}

async function openDemoWithCaptcha(page: Page) {
  await openDemo(page, /site key returned/)
  const sdkCaptcha = await page
    .getByTestId("captcha-diagnostics")
    .getAttribute("data-sdk-captcha")
  test.skip(
    sdkCaptcha !== "yes",
    "installed SDK has no Captcha support; run scripts/use-local-sdk.sh"
  )
}

async function continueWithEmail(page: Page, email: string) {
  await page.getByPlaceholder("Enter your email").fill(email)
  await page.getByRole("button", { name: "Continue with email" }).click()
  await page.waitForURL(/\/verify-email\?/, { waitUntil: "commit" })
}

async function enterOtp(page: Page) {
  await page.locator("input[data-input-otp]").fill("123456")
  await page.getByRole("button", { name: "Verify and continue" }).click()
}

/** An EIP-6963 wallet whose key lives only in this test process. */
async function injectWallet(page: Page) {
  const account = privateKeyToAccount(generatePrivateKey())
  await page.exposeFunction("__e2eWalletSign", (message: `0x${string}`) =>
    account.signMessage({ message: { raw: message } })
  )
  await page.addInitScript((address: string) => {
    const listeners = new Map<string, Set<(...args: unknown[]) => void>>()
    const provider = {
      isMetaMask: false,
      async request({ method, params }: { method: string; params?: any[] }) {
        switch (method) {
          case "eth_requestAccounts":
          case "eth_accounts":
            return [address]
          case "eth_chainId":
            return "0xaa36a7"
          case "net_version":
            return "11155111"
          case "personal_sign":
            return (window as any).__e2eWalletSign(params![0])
          case "wallet_switchEthereumChain":
            return null
          default:
            throw Object.assign(new Error(`unsupported ${method}`), {
              code: 4200,
            })
        }
      },
      on(event: string, listener: (...args: unknown[]) => void) {
        if (!listeners.has(event)) listeners.set(event, new Set())
        listeners.get(event)!.add(listener)
        return provider
      },
      removeListener(event: string, listener: (...args: unknown[]) => void) {
        listeners.get(event)?.delete(listener)
        return provider
      },
    }
    const announce = () =>
      window.dispatchEvent(
        new CustomEvent("eip6963:announceProvider", {
          detail: Object.freeze({
            info: {
              uuid: "00000000-0000-4000-8000-0000000e2e00",
              name: "E2E Wallet",
              icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E",
              rdns: "io.0xkey.e2e",
            },
            provider,
          }),
        })
      )
    window.addEventListener("eip6963:requestProvider", announce)
    announce()
  }, account.address)
}

test.describe("Captcha off (no site key)", () => {
  test.beforeEach(() => mock.reset({}))

  test("renders no widget and sends no Captcha token on OTP init", async ({
    page,
  }) => {
    const turnstile = watchTurnstile(page)
    await openDemo(page, /no site key/)

    await continueWithEmail(page, "captcha-off@example.test")

    const [init] = requestsTo(["/v1/otp_init", "/v1/otp_init_v2"])
    expect(init).toBeDefined()
    expect(init.captchaTokenPresent).toBe(false)
    expect(init.captchaConfigId).toBeNull()
    expect(turnstile.script).toBe(0)
    expect(turnstile.frames).toBe(0)
    expect(requestsTo(PROTECTED_PATHS).some((r) => r.captchaTokenPresent)).toBe(
      false
    )
  })
  test("sends no Captcha token on new wallet signup", async ({ page }) => {
    const turnstile = watchTurnstile(page)
    await injectWallet(page)
    await openDemo(page, /no site key/)

    await page.getByRole("button", { name: "Continue with wallet" }).click()
    await page.getByRole("button", { name: /E2E Wallet/ }).click()

    await expect
      .poll(() => requestsTo(["/v1/signup", "/v1/signup_v2"]).length)
      .toBe(1)
    expect(mock.requests().some((r) => r.captchaTokenPresent)).toBe(false)
    expect(turnstile.frames).toBe(0)
  })
})

test.describe("Captcha on (Cloudflare test site key)", () => {
  test.beforeEach(() => mock.reset({ siteKey: TURNSTILE_TEST_SITE_KEY }))

  test("renders the widget and sends a token on OTP init", async ({ page }) => {
    const turnstile = watchTurnstile(page)
    await openDemoWithCaptcha(page)

    await continueWithEmail(page, "captcha-on@example.test")

    const inits = requestsTo(["/v1/otp_init", "/v1/otp_init_v2"])
    expect(inits).toHaveLength(1)
    expect(inits[0].captchaTokenPresent).toBe(true)
    expect(inits[0].captchaConfigId).toBe(AUTH_PROXY_CONFIG_ID)
    expect(turnstile.script).toBeGreaterThan(0)
    await expect.poll(() => turnstile.frames).toBeGreaterThan(0)
  })

  test("sends a token on new wallet signup", async ({ page }) => {
    await injectWallet(page)
    await openDemoWithCaptcha(page)

    await page.getByRole("button", { name: "Continue with wallet" }).click()
    await page.getByRole("button", { name: /E2E Wallet/ }).click()

    await expect
      .poll(() => requestsTo(["/v1/signup", "/v1/signup_v2"]).length)
      .toBe(1)
    const [signup] = requestsTo(["/v1/signup", "/v1/signup_v2"])
    expect(signup.captchaTokenPresent).toBe(true)
    expect(signup.captchaConfigId).toBe(AUTH_PROXY_CONFIG_ID)
    const [lookup] = requestsTo(["/v1/account"])
    expect(lookup.captchaTokenPresent).toBe(false)
  })

  test("sends no token on OTP-verified signup", async ({ page }) => {
    await openDemoWithCaptcha(page)
    await continueWithEmail(page, "otp-signup@example.test")
    await enterOtp(page)

    await expect
      .poll(() => requestsTo(["/v1/signup", "/v1/signup_v2"]).length)
      .toBe(1)
    const [signup] = requestsTo(["/v1/signup", "/v1/signup_v2"])
    expect(signup.path).toBe("/v1/signup_v2")
    expect(signup.body?.verificationToken).toEqual(expect.any(String))
    expect(signup.captchaTokenPresent).toBe(false)
    expect(signup.captchaConfigId).toBeNull()
    const [init] = requestsTo(["/v1/otp_init", "/v1/otp_init_v2"])
    expect(init.captchaTokenPresent).toBe(true)
  })

  test("sends no token on OTP login", async ({ page }) => {
    mock.reset({ siteKey: TURNSTILE_TEST_SITE_KEY, existingAccount: true })
    await openDemoWithCaptcha(page)
    await continueWithEmail(page, "otp-login@example.test")
    await enterOtp(page)

    const loginPaths = [
      "/v1/otp_login",
      "/v1/otp_login_v2",
      "/public/v1/submit/stamp_login",
    ]
    await expect.poll(() => requestsTo(loginPaths).length).toBe(1)
    const [login] = requestsTo(loginPaths)
    expect(login.captchaTokenPresent).toBe(false)
    expect(requestsTo(["/v1/signup", "/v1/signup_v2"])).toHaveLength(0)
    expect(
      mock
        .requests()
        .filter((r) => r.captchaTokenPresent)
        .map((r) => r.path)
    ).toEqual([expect.stringMatching(/^\/v1\/otp_init/)])
  })

  test("sends no token on existing wallet login", async ({ page }) => {
    mock.reset({ siteKey: TURNSTILE_TEST_SITE_KEY, existingAccount: true })
    const turnstile = watchTurnstile(page)
    await injectWallet(page)
    await openDemoWithCaptcha(page)

    await page.getByRole("button", { name: "Continue with wallet" }).click()
    await page.getByRole("button", { name: /E2E Wallet/ }).click()

    await expect.poll(() => requestsTo(["/v1/account"]).length).toBe(1)
    await expect
      .poll(() => requestsTo(["/public/v1/submit/stamp_login"]).length)
      .toBe(1)
    expect(requestsTo(["/v1/signup", "/v1/signup_v2"])).toHaveLength(0)
    expect(mock.requests().some((r) => r.captchaTokenPresent)).toBe(false)
    expect(turnstile.frames).toBe(0)
  })
})
