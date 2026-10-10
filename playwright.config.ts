import { defineConfig, devices } from "@playwright/test"

import { DEMO_PORT, MOCK_AUTH_PROXY_PORT } from "./e2e/ports"

const mockUrl = `http://127.0.0.1:${MOCK_AUTH_PROXY_PORT}`

// Placeholder values only: every Auth Proxy and API call goes to the local
// mock started by the tests, and no server action is exercised.
const demoEnv = {
  NEXT_TELEMETRY_DISABLED: "1",
  NEXT_PUBLIC_APP_URL: `http://localhost:${DEMO_PORT}`,
  NEXT_PUBLIC_BASE_URL: mockUrl,
  NEXT_PUBLIC_AUTH_PROXY_URL: mockUrl,
  NEXT_PUBLIC_AUTH_PROXY_ID: "00000000-0000-4000-8000-0000000000b1",
  NEXT_PUBLIC_ORGANIZATION_ID: "00000000-0000-4000-8000-00000000e2e0",
  NEXT_PUBLIC_RP_ID: "localhost",
  NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID: "e2e-google-client-id",
  NEXT_PUBLIC_APPLE_OAUTH_CLIENT_ID: "e2e-apple-client-id",
  NEXT_PUBLIC_FACEBOOK_CLIENT_ID: "e2e-facebook-client-id",
  NEXT_PUBLIC_FACEBOOK_GRAPH_API_VERSION: "21.0",
  NEXT_PUBLIC_FACEBOOK_AUTH_VERSION: "11.0",
  NEXT_PUBLIC_ALCHEMY_API_KEY: "e2e-unused",
  COINGECKO_API_KEY: "e2e-unused",
  ZEROXKEY_API_PUBLIC_KEY: "e2e-unused",
  ZEROXKEY_API_PRIVATE_KEY: "e2e-unused",
  ZEROXKEY_WARCHEST_API_PUBLIC_KEY: "e2e-unused",
  ZEROXKEY_WARCHEST_API_PRIVATE_KEY: "e2e-unused",
  ZEROXKEY_WARCHEST_ORGANIZATION_ID: "e2e-unused",
  WARCHEST_PRIVATE_KEY_ID: "e2e-unused",
  FACEBOOK_SECRET_SALT: "e2e-unused",
}

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 180_000,
  expect: { timeout: 30_000 },
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${DEMO_PORT}`,
    trace: "off",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // e.g. PLAYWRIGHT_CHROMIUM_CHANNEL=chrome to reuse an installed Chrome.
        channel: process.env.PLAYWRIGHT_CHROMIUM_CHANNEL || undefined,
      },
    },
  ],
  webServer: {
    command: `pnpm exec next dev -p ${DEMO_PORT}`,
    url: `http://localhost:${DEMO_PORT}`,
    env: demoEnv,
    timeout: 180_000,
    reuseExistingServer: false,
  },
})
