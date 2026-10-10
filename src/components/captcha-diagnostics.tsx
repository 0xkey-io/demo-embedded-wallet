"use client"

import { useCallback, useEffect, useState } from "react"
import * as zeroXKeyCore from "@0xkey-io/core"

import { zeroXKeyConfig } from "@/config/0xkey"

const DEFAULT_AUTH_PROXY_URL = "https://authproxy.0xkey.io"

// Cloudflare's published Turnstile test site keys.
const CLOUDFLARE_TEST_SITE_KEYS: Record<string, string> = {
  "1x00000000000000000000AA": "always passes, visible",
  "2x00000000000000000000AB": "always blocks, visible",
  "1x00000000000000000000BB": "always passes, invisible",
  "2x00000000000000000000BB": "always blocks, invisible",
  "3x00000000000000000000FF": "forces interactive challenge",
}

type ClientParamsState =
  | { status: "loading" }
  | { status: "off" }
  | { status: "on"; siteKey: string }
  | { status: "error"; reason: string }

// Wallet Kit releases with Captcha support export getClientParams from Core.
const sdkSupportsCaptcha =
  typeof (zeroXKeyCore as unknown as Record<string, unknown>)
    .getClientParams === "function"

function maskSiteKey(siteKey: string) {
  const testKey = CLOUDFLARE_TEST_SITE_KEYS[siteKey]
  if (testKey) return `${siteKey} (Cloudflare test key: ${testKey})`
  if (siteKey.length <= 8) return "set"
  return `${siteKey.slice(0, 4)}…${siteKey.slice(-2)}`
}

async function readClientParams(): Promise<ClientParamsState> {
  const configId = zeroXKeyConfig.authProxyConfigId
  if (!configId) return { status: "error", reason: "no Auth Proxy config ID" }
  const url = new URL(zeroXKeyConfig.authProxyUrl || DEFAULT_AUTH_PROXY_URL)
  url.pathname =
    url.pathname.replace(/\/+$/, "") + "/v1/wallet_kit_client_params"
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Proxy-Config-ID": configId,
      },
      body: "{}",
      cache: "no-store",
    })
    if (!response.ok) {
      return { status: "error", reason: `HTTP ${response.status}` }
    }
    const body = (await response.json()) as { turnstileSiteKey?: unknown }
    if (typeof body?.turnstileSiteKey === "string" && body.turnstileSiteKey) {
      return { status: "on", siteKey: body.turnstileSiteKey }
    }
    return { status: "off" }
  } catch {
    return { status: "error", reason: "request failed" }
  }
}

/** Development-only view of the public Captcha capability. Never shows tokens. */
export function CaptchaDiagnostics() {
  if (process.env.NODE_ENV === "production") return null
  return <CaptchaDiagnosticsPanel />
}

function CaptchaDiagnosticsPanel() {
  const [state, setState] = useState<ClientParamsState>({ status: "loading" })

  const refresh = useCallback(async () => {
    setState({ status: "loading" })
    setState(await readClientParams())
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return (
    <aside
      data-testid="captcha-diagnostics"
      data-captcha-status={state.status}
      data-sdk-captcha={sdkSupportsCaptcha ? "yes" : "no"}
      className="bg-background/95 fixed bottom-3 left-3 z-50 max-w-xs rounded-md border p-3 text-xs shadow-sm"
    >
      <div className="mb-1 flex items-center justify-between gap-2 font-semibold">
        <span>Captcha diagnostics (dev only)</span>
        <button
          type="button"
          className="text-muted-foreground underline"
          onClick={() => void refresh()}
        >
          Refresh
        </button>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5">
        <dt className="text-muted-foreground">Client params</dt>
        <dd data-testid="captcha-diagnostics-status">
          {state.status === "loading" && "loading…"}
          {state.status === "off" && "no site key (Captcha off)"}
          {state.status === "on" && "site key returned (Captcha on)"}
          {state.status === "error" && `unavailable (${state.reason})`}
        </dd>
        {state.status === "on" && (
          <>
            <dt className="text-muted-foreground">Site key</dt>
            <dd className="break-all">{maskSiteKey(state.siteKey)}</dd>
          </>
        )}
        <dt className="text-muted-foreground">SDK Captcha</dt>
        <dd>{sdkSupportsCaptcha ? "supported" : "not in installed SDK"}</dd>
      </dl>
      {state.status === "on" && !sdkSupportsCaptcha && (
        <p className="mt-1 text-red-600">
          Protected OTP and signup requests will be rejected: install a
          Captcha-capable SDK (see README).
        </p>
      )}
    </aside>
  )
}
