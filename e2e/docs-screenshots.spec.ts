import { mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { test } from "@playwright/test"

import {
  MOCK_ORGANIZATION_ID,
  startMockAuthProxy,
  type MockAuthProxy,
} from "./mock-auth-proxy"
import { MOCK_AUTH_PROXY_PORT } from "./ports"

// Regenerates the demo screenshots used by 0xkey-io/docs against the local
// mock Auth Proxy. Opt-in:
//   DOCS_SCREENSHOTS_DIR=<docs checkout> pnpm test:e2e docs-screenshots
const docsRoot = process.env.DOCS_SCREENSHOTS_DIR
test.skip(!docsRoot, "set DOCS_SCREENSHOTS_DIR to regenerate docs screenshots")
test.use({
  viewport: { width: 1280, height: 1100 },
  deviceScaleFactor: 2,
  colorScheme: "light",
  locale: "en-US",
})

let mock: MockAuthProxy

test.beforeAll(async () => {
  mock = await startMockAuthProxy(MOCK_AUTH_PROXY_PORT)
})

test.afterAll(async () => {
  await mock?.close()
})

test("social login screen", async ({ page }) => {
  await page.route("**/v1/wallet_kit_config", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        enabledProviders: ["email", "passkey", "google", "apple", "facebook"],
        sessionExpirationSeconds: "900",
        organizationId: MOCK_ORGANIZATION_ID,
        otpAlphanumeric: false,
        otpLength: "6",
      }),
    })
  )
  await page.goto("/")
  await page.waitForLoadState("networkidle")
  // Dev-only overlays (Next.js indicator, Captcha diagnostics) are not product UI.
  await page.addStyleTag({
    content:
      "nextjs-portal, .fixed.bottom-3.left-3 { display: none !important; }",
  })
  await page.waitForTimeout(500)
  const target = join(
    docsRoot!,
    "images/authentication/img/oauth_demo_wallet.png"
  )
  mkdirSync(dirname(target), { recursive: true })
  await page
    .locator("div", {
      has: page.getByText("Log in or sign up", { exact: true }),
    })
    .filter({ has: page.getByText("Continue with Google") })
    .last()
    .screenshot({ path: target })
})
