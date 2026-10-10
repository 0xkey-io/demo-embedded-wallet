// Defaults avoid the demo's own dev port (3200); override if they are taken.
export const DEMO_PORT = Number(process.env.E2E_DEMO_PORT || 3250)
export const MOCK_AUTH_PROXY_PORT = Number(
  process.env.E2E_MOCK_AUTH_PROXY_PORT || 3293
)
